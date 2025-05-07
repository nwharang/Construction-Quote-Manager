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
  username: z.string().min(1),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  // Add other fields like name if necessary
});

// Define update profile input schema for router validation
const updateProfileRouterInputSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().url().nullish(),
});

// Zod schema for changing password - to be used by the router
const changePasswordRouterInputSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"], // specifies which field the error is associated with
});

// Zod schema for updating login info (email/username)
// Ensure this is exported for use in the frontend
export const updateLoginInfoRouterInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long').optional(),
  currentPassword: z.string().min(1, 'Current password is required'),
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
          image: true,
          username: true,
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
          username: user.username,
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
    .mutation(async ({ ctx, input }) => {
      const authService = new AuthService(db, ctx); // db needs to be available here
      try {
        const updatedUser = await authService.updateUserProfile(input);
        return updatedUser;
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

  changePassword: protectedProcedure
    .input(changePasswordRouterInputSchema)
    .mutation(async ({ ctx, input }) => {
      const authService = new AuthService(db, ctx); // db needs to be available here
      try {
        return await authService.changePassword(input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        // Handle specific errors or rethrow a generic one
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change password',
          cause: error,
        });
      }
    }),

  updateLoginInfo: protectedProcedure
    .input(updateLoginInfoRouterInputSchema)
    .mutation(async ({ ctx, input }) => {
      const authService = new AuthService(db, ctx);
      try {
        const result = await authService.updateLoginInfo(input);
        return result; // Should include success status and possibly updated user info
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update login information',
          cause: error,
        });
      }
    }),
});
