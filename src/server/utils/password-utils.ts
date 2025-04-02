import { compare, hash } from "bcryptjs";

/**
 * Creates a salted and hashed password
 * @param password The plaintext password to hash
 * @returns The hashed password
 */
export async function saltAndHashPassword(password: string) {
  const hashedPassword = await hash(password, 12);
  return hashedPassword;
}

/**
 * Checks if a plaintext password matches a hashed password
 * @param hashedPassword The hashed password from the database
 * @param password The plaintext password to check
 * @returns True if the password matches, false otherwise
 */
export async function isPasswordValid(
  hashedPassword: string,
  password: string,
) {
  const isValid = await compare(password, hashedPassword);
  return isValid;
} 