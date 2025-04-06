import { type Session } from 'next-auth';
import { BaseService } from './baseService';
import type { DB } from './types';
import { TRPCError } from '@trpc/server';
import { users } from '../db/schema'; // Import users schema
import { eq } from 'drizzle-orm'; // Import eq operator
import { compare, hash } from 'bcryptjs'; // Import compare and hash functions
import { z } from 'zod'; // Import zod for input type inference

// Define registration input schema type based on the one in authRouter
const registerUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});
type RegisterUserInput = z.infer<typeof registerUserSchema>;

// Define update profile input schema type based on the one in authRouter
const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().url().nullish(),
  role: z.enum(['contractor', 'subcontractor', 'supplier', 'other']).optional(),
});
type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

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
   * Verifies user credentials (email and password).
   * @param email - User's email
   * @param password - User's plaintext password
   * @returns The user object (without password hash) if credentials are valid.
   * @throws TRPCError if user not found or password invalid.
   */
  async verifyUserCredentials(
    email: string,
    password: string
  ): Promise<Omit<typeof users.$inferSelect, 'hashedPassword'>> {
    // 1. Find user by email (using eq with lowercased email)
    const potentialUser = await this.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!potentialUser) {
      throw new TRPCError({
        code: 'NOT_FOUND', // Changed from UNAUTHORIZED
        message: 'User with this email does not exist.', // More specific internal message
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
    const { name, email, password } = input;
    const lowerCaseEmail = email.toLowerCase();

    // 1. Check if user already exists
    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.email, lowerCaseEmail),
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
    const userId = this.getUserId(); // Get ID of authenticated user

    const dataToUpdate: Partial<typeof users.$inferSelect> = {};

    // Map input fields to database fields
    if (input.name) dataToUpdate.name = input.name;
    if (input.image !== undefined) dataToUpdate.image = input.image;

    // Only proceed if there are fields to update
    if (Object.keys(dataToUpdate).length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No valid fields provided for update.',
      });
    }

    // Add updatedAt timestamp
    dataToUpdate.updatedAt = new Date();

    // Update the user in the database
    const [updatedUser] = await this.db
      .update(users)
      .set(dataToUpdate)
      .where(eq(users.id, userId))
      .returning(); // Return all columns

    if (!updatedUser) {
      // This might happen if the user was deleted between getting the ID and updating
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found or update failed.',
      });
    }

    // Return the updated user data (can omit hash if needed, but returning returns all)
    return updatedUser;
  }

  // Add other authentication-related methods here if needed
  // e.g., methods related to user roles, specific permissions, etc.
  // For now, standard authentication is handled by next-auth and tRPC middleware.
}
