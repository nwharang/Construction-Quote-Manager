import { type Session } from 'next-auth';
import { BaseService } from './baseService';
import type { DB } from './types';
import { TRPCError } from '@trpc/server';
import { users } from '../db/schema'; // Import users schema
import { eq, or } from 'drizzle-orm'; // Import eq operator
import { compare, hash } from 'bcryptjs'; // Import compare and hash functions
import { z } from 'zod'; // Import zod for input type inference

// Define registration input schema type based on the one in authRouter
const registerUserSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});
type RegisterUserInput = z.infer<typeof registerUserSchema>;

// Define update profile input schema type based on the one in authRouter
const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().url().nullish(),
});
type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Zod schema for changing password (can be defined in router or service)
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"], // path of error
});
type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Zod schema for updating login info (email/username) - for service layer type safety
const updateLoginInfoServiceSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3).max(50).optional(),
  currentPassword: z.string().min(1),
});
type UpdateLoginInfoInput = z.infer<typeof updateLoginInfoServiceSchema>;

/**
 * Service layer for authentication-related operations.
 * Currently, it primarily handles retrieving session information.
 */
export class AuthService extends BaseService {
  // Define ctx property
  protected readonly ctx: { session: Session | null };

  constructor(db: DB, ctx: { session: Session | null }) {
    super(db, ctx);
    // Assign ctx in constructor
    this.ctx = ctx;
  }

  /**
   * Retrieves the current user session from the context.
   * Throws an error if the user is not authenticated.
   */
  getSession(): Session {
    if (!this.ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User is not authenticated.',
      });
    }
    return this.ctx.session;
  }

  /**
   * Retrieves the current user ID from the session.
   * Throws an error if the user is not authenticated.
   */
  getUserId(): string {
    return this.getSession().user.id;
  }

  /**
   * Verifies user credentials (email or username and password).
   * @param emailOrUsername - User's email or username
   * @param password - User's plaintext password
   * @returns The user object (without password hash) if credentials are valid.
   * @throws TRPCError if user not found or password invalid.
   */
  async verifyUserCredentials(
    emailOrUsername: string,
    password: string
  ): Promise<Omit<typeof users.$inferSelect, 'hashedPassword'>> {
    // 1. Find user by email or username
    const potentialUser = await this.db.query.users.findFirst({
      where: or(
        eq(users.email, emailOrUsername.toLowerCase()),
        eq(users.username, emailOrUsername)
      ),
    });

    if (!potentialUser) {
      throw new TRPCError({
        code: 'NOT_FOUND', // Changed from UNAUTHORIZED
        message: 'User with this email or username does not exist.', // More specific internal message
      });
    }

    // 2. Compare passwords using bcryptjs compare
    if (!potentialUser.hashedPassword) {
      // Check if hash exists
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'User password data is missing.',
      });
    }
    const passwordsMatch = await compare(password, potentialUser.hashedPassword);

    if (!passwordsMatch) {
      throw new TRPCError({
        code: 'UNAUTHORIZED', // Keep UNAUTHORIZED for incorrect password
        message: 'Incorrect password provided.', // More specific internal message
      });
    }

    // 4. Return user data (excluding sensitive fields like hash)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedPassword, ...userWithoutPassword } = potentialUser;
    return userWithoutPassword; // Type matches the Omit return type now
  }

  /**
   * Registers a new user.
   * @param input - User registration data (name, email, password, role)
   * @returns The newly created user object (without password hash).
   * @throws TRPCError if email already exists.
   */
  async registerUser(
    input: RegisterUserInput
  ): Promise<Omit<typeof users.$inferSelect, 'hashedPassword'>> {
    const { name, username, email, password } = input;
    const lowerCaseEmail = email.toLowerCase();

    // 1. Check if user already exists
    const existingUser = await this.db.query.users.findFirst({
      where: or(eq(users.email, lowerCaseEmail), eq(users.username, username)),
      columns: { id: true }, // Only need to check for existence
    });

    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'User with this email already exists',
      });
    }

    // 2. Hash the password
    const hashedPassword = await hash(password, 12);

    // 3. Create the user
    const [newUserRaw] = await this.db
      .insert(users)
      .values({
        name,
        username,
        email: lowerCaseEmail,
        hashedPassword, // Store the hashed password
      })
      .returning(); // Return all columns

    if (!newUserRaw) {
      throw new TRPCError({
        // Should not happen if insert is successful
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user after insert.',
      });
    }

    // 4. Return user data (excluding sensitive fields like hash)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedPassword: removedHash, ...newUser } = newUserRaw;
    return newUser;
  }

  /**
   * Updates the profile for the currently authenticated user.
   * @param input - Profile data to update (name, image, role)
   * @returns The updated user profile object.
   * @throws TRPCError if user not found or update fails.
   */
  async updateUserProfile(input: UpdateProfileInput): Promise<typeof users.$inferSelect> {
    const userId = this.getUserId();
    const dataToUpdate: Partial<Omit<typeof users.$inferSelect, 'id' | 'email' | 'username' | 'hashedPassword' | 'emailVerified' | 'createdAt'> > = {};
    if (input.name) dataToUpdate.name = input.name;
    if (input.image !== undefined) dataToUpdate.image = input.image; 

    if (Object.keys(dataToUpdate).length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No valid fields provided for profile update.',
      });
    }
    dataToUpdate.updatedAt = new Date();
    const [updatedUser] = await this.db
      .update(users)
      .set(dataToUpdate)
      .where(eq(users.id, userId))
      .returning();
    if (!updatedUser) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found or profile update failed.',
      });
    }
    return updatedUser;
  }

  async changePassword(input: ChangePasswordInput): Promise<{ success: boolean }> {
    const userId = this.getUserId();
    const { oldPassword, newPassword } = input;

    const currentUser = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!currentUser || !currentUser.hashedPassword) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'User not found or password data is missing.',
      });
    }

    const isOldPasswordCorrect = await compare(oldPassword, currentUser.hashedPassword);
    if (!isOldPasswordCorrect) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Incorrect old password.',
      });
    }

    const newHashedPassword = await hash(newPassword, 12);

    await this.db
      .update(users)
      .set({
        hashedPassword: newHashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true };
  }

  async updateLoginInfo(input: UpdateLoginInfoInput): Promise<{ success: boolean; message: string; user?: Omit<typeof users.$inferSelect, 'hashedPassword'> }> {
    const userId = this.getUserId();
    const { email, username, currentPassword } = input;
    const lowerCaseEmail = email.toLowerCase();

    // 1. Verify current password
    const currentUser = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!currentUser || !currentUser.hashedPassword) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'User not found or password data is missing.',
      });
    }

    const isPasswordCorrect = await compare(currentPassword, currentUser.hashedPassword);
    if (!isPasswordCorrect) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Incorrect current password.',
      });
    }

    // 2. Check for conflicts if email/username are being changed
    const updates: Partial<typeof users.$inferInsert> = {};
    let emailChanged = false;
    let usernameChanged = false;

    if (lowerCaseEmail !== currentUser.email) {
      const existingEmailUser = await this.db.query.users.findFirst({
        where: eq(users.email, lowerCaseEmail),
        columns: { id: true },
      });
      if (existingEmailUser && existingEmailUser.id !== userId) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This email address is already in use by another account.',
        });
      }
      updates.email = lowerCaseEmail;
      updates.emailVerified = null; // Reset email verification status
      emailChanged = true;
    }

    if (username && username !== currentUser.username) {
      const existingUsernameUser = await this.db.query.users.findFirst({
        where: eq(users.username, username),
        columns: { id: true },
      });
      if (existingUsernameUser && existingUsernameUser.id !== userId) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This username is already in use by another account.',
        });
      }
      updates.username = username;
      usernameChanged = true;
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, message: 'No changes to login information were made.', user: currentUser };
    }

    updates.updatedAt = new Date();

    // 3. Apply updates
    const [updatedUserRecord] = await this.db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUserRecord) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update login information in the database.',
      });
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedPassword, ...userWithoutPassword } = updatedUserRecord;

    let message = 'Login information updated successfully.';
    if (emailChanged) {
      message += ' Please verify your new email address.'; // Adapt if email verification email is sent
    }

    return { success: true, message, user: userWithoutPassword };
  }

  // Add other authentication-related methods here if needed
  // e.g., methods related to user roles, specific permissions, etc.
  // For now, standard authentication is handled by next-auth and tRPC middleware.
}
