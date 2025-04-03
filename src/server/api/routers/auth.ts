import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { users } from '~/server/db/schema';
import { eq } from 'drizzle-orm';
import { AuthService } from '~/server/services/authService';
import { db } from '~/server/db';
import { TRPCError } from '@trpc/server';

// Schema for user login
const loginUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Schema for user registration (assuming it's needed for other procedures)
const registerInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  // Add other fields like name if necessary
});

// Define update profile input schema for router validation
const updateProfileRouterInputSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().url().nullish(),
});

export const authRouter = createTRPCRouter({
  /**
   * Retrieves the current user session information.
   * Requires the user to be authenticated.
   */
  getSession: protectedProcedure.query(({ ctx }) => {
    // Instantiate AuthService with db and context
    const authService = new AuthService(db, ctx);
    // Delegate the logic to the AuthService
    return authService.getSession();
  }),

  // Get the current user profile (authorized users only)
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Use AuthService to get user ID
      const authService = new AuthService(db, ctx);
      const userId = authService.getUserId();

      // Fetch user details from DB using the ID
      const userProfile = await db.query.users.findFirst({
        where: eq(users.id, userId),
        // Exclude sensitive fields if necessary
        columns: {
          id: true,
          name: true,
          email: true,
          // Exclude passwordHash etc.
        },
      });

      if (!userProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User profile not found.',
        });
      }
      return userProfile;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user profile',
        cause: error,
      });
    }
  }),

  // Add register procedure if needed, using the schema
  // register: publicProcedure
  //   .input(registerInputSchema)
  //   .mutation(async ({ ctx, input }) => {
  //     // Implement registration logic using db
  //     // Hash password, check for existing user, etc.
  //     // ... implementation needed ...
  //     return { success: true }; // Or return user object
  //   }),

  login: publicProcedure.input(loginUserSchema).mutation(async ({ input, ctx }) => {
    try {
      const authService = new AuthService(db, ctx);
      const user = await authService.verifyUserCredentials(input.email, input.password);
      return {
        status: 'success',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Login failed',
        cause: error,
      });
    }
  }),

  // Create a new user (public procedure)
  register: publicProcedure.input(registerInputSchema).mutation(async ({ input, ctx }) => {
    try {
      // Instantiate AuthService
      const authService = new AuthService(db, ctx);

      // Delegate registration to the service
      const newUser = await authService.registerUser(input);

      // Return success and the new user data (without hash)
      return {
        status: 'success',
        user: newUser, // newUser already excludes the hash
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      // Catch specific errors from service if needed, otherwise keep generic
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to register user',
        cause: error,
      });
    }
  }),

  // Update user profile (authorized users only)
  updateProfile: protectedProcedure
    .input(updateProfileRouterInputSchema) // Use the defined input schema
    .mutation(async ({ input, ctx }) => {
      try {
        // Instantiate AuthService
        const authService = new AuthService(db, ctx);

        // Delegate update to the service
        // The service method already gets the userId from context
        const updatedUser = await authService.updateUserProfile(input);

        // Return success and the updated user data
        return {
          status: 'success',
          user: updatedUser, // Service returns the updated user object
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        // Catch specific errors from service if needed, otherwise keep generic
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
          cause: error,
        });
      }
    }),
});
