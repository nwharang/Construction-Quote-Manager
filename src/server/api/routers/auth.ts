import { z } from 'zod';
import { hash, compare } from 'bcryptjs';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Schema for user registration
const registerUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['contractor', 'subcontractor', 'supplier', 'other'], {
    required_error: 'Role is required',
  }),
});

// Schema for user login
const loginUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Schema for profile update
const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().url().nullish(),
  role: z.enum(['contractor', 'subcontractor', 'supplier', 'other']).optional(),
});

export const authRouter = createTRPCRouter({
  // Get the current user profile (authorized users only)
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      // 1. Get user ID from session
      const userId = ctx.session.user.id;
      
      // 2. Fetch user profile from database
      const user = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .then((rows) => rows[0]);

      // 3. Verify user exists
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // 4. Return user profile
      return user;
    } catch (error) {
      // 5. Handle errors
      console.error('Error fetching user profile:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user profile',
        cause: error,
      });
    }
  }),

  // Login user (public procedure)
  login: publicProcedure
    .input(loginUserSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // 1. Extract input data
        const { email, password } = input;

        // 2. Find user by email
        const user = await ctx.db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .then((rows) => rows[0]);

        // 3. Verify user exists and has a password
        if (!user || !user.hashedPassword) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invalid email or password',
          });
        }

        // 4. Verify password
        const passwordMatches = await compare(password, user.hashedPassword);

        // 5. Handle authentication failure
        if (!passwordMatches) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          });
        }

        // 6. Return successful login response
        return {
          status: 'success',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      } catch (error) {
        // 7. Handle errors
        console.error('Error logging in:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to login',
          cause: error,
        });
      }
    }),

  // Create a new user (public procedure)
  register: publicProcedure
    .input(registerUserSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // 1. Extract input data
        const { name, email, password, role } = input;

        // 2. Check if user already exists
        const existingUsers = await ctx.db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email.toLowerCase()));

        // 3. Handle existing user case
        if (existingUsers.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User with this email already exists',
          });
        }

        // 4. Hash the password
        const hashedPassword = await hash(password, 12);

        // 5. Create the user
        const [newUser] = await ctx.db
          .insert(users)
          .values({
            name,
            email: email.toLowerCase(),
            hashedPassword,
            role,
          })
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
          });

        // 6. Return successful registration response
        return {
          status: 'success',
          user: newUser,
        };
      } catch (error) {
        // 7. Handle errors
        console.error('Error registering user:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to register user',
          cause: error,
        });
      }
    }),

  // Update user profile (authorized users only)
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // 1. Get user ID from session
        const userId = ctx.session.user.id;
        
        // 2. Prepare data to update
        const dataToUpdate: Record<string, unknown> = {};

        if (input.name) dataToUpdate.name = input.name;
        if (input.image !== undefined) dataToUpdate.image = input.image;
        if (input.role) dataToUpdate.role = input.role;

        // 3. Validate update data
        if (Object.keys(dataToUpdate).length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No valid fields to update',
          });
        }

        // 4. Update the user profile
        const [updatedUser] = await ctx.db
          .update(users)
          .set({
            ...dataToUpdate,
            // Don't set updatedAt if the schema doesn't support it
          })
          .where(eq(users.id, userId))
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
            role: users.role,
          });

        // 5. Verify update was successful
        if (!updatedUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // 6. Return updated profile
        return {
          status: 'success',
          user: updatedUser,
        };
      } catch (error) {
        // 7. Handle errors
        console.error('Error updating profile:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
          cause: error,
        });
      }
    }),
});
