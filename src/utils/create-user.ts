import { hash } from "bcryptjs";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import type { InferModel } from "drizzle-orm";

interface CreateUserParams {
  name: string;
  email: string;
  password: string;
  role: string;
  username?: string;
}

type User = InferModel<typeof users>;

export async function createUser({ name, email, password, role, username }: CreateUserParams) {
  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("User already exists");
  }

  // Hash the password
  const hashedPassword = await hash(password, 12);

  // Create the user in the database
  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      hashedPassword,
      role,
      username,
    })
    .returning();

  if (!user) {
    throw new Error("Failed to create user");
  }

  // Return the user without the hashed password
  const { hashedPassword: _, ...userWithoutPassword } = user as User;
  return userWithoutPassword;
} 