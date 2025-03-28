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

export const authRouter = createTRPCRouter({
  // Get the current user profile (authorized users only)
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { session, db } = ctx;

      const user = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, session.user.id))
        .then((rows) => rows[0]);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user profile',
        cause: error,
      });
    }
  }),

  // Login user (public procedure)
  login: publicProcedure.input(loginUserSchema).mutation(async ({ input, ctx }) => {
    try {
      const { email, password } = input;

      // Find user by email
      const user = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .then((rows) => rows[0]);

      if (!user || !user.hashedPassword) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid email or password',
        });
      }

      // Verify password
      const passwordMatches = await compare(password, user.hashedPassword);

      if (!passwordMatches) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

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
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to login',
        cause: error,
      });
    }
  }),

  // Create a new user (public procedure)
  register: publicProcedure.input(registerUserSchema).mutation(async ({ input, ctx }) => {
    try {
      const { name, email, password, role } = input;

      // Check if user already exists
      const existingUsers = await ctx.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email.toLowerCase()));

      if (existingUsers.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }

      // Hash the password
      const hashedPassword = await hash(password, 12);

      // Create the user
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

      return {
        status: 'success',
        user: newUser,
      };
    } catch (error) {
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
    .input(
      z.object({
        name: z.string().min(1).optional(),
        image: z.string().url().nullish(),
        role: z.enum(['contractor', 'subcontractor', 'supplier', 'other']).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { session, db } = ctx;

        const dataToUpdate: Record<string, unknown> = {};

        if (input.name) dataToUpdate.name = input.name;
        if (input.image !== undefined) dataToUpdate.image = input.image;
        if (input.role) dataToUpdate.role = input.role;

        // Only proceed if there are fields to update
        if (Object.keys(dataToUpdate).length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No valid fields to update',
          });
        }

        // Update the user
        const [updatedUser] = await db
          .update(users)
          .set(dataToUpdate)
          .where(eq(users.id, session.user.id))
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
            role: users.role,
          });

        if (!updatedUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        return {
          status: 'success',
          user: updatedUser,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
          cause: error,
        });
      }
    }),
});
