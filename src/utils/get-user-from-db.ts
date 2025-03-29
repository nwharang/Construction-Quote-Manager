import { db } from "~/server/db";
import { or, sql } from "drizzle-orm";
import { isPasswordValid } from "./password-utils";

export async function getUserFromDb(emailOrUsername: string, password: string) {
  const input = emailOrUsername.toLowerCase();

  const userFound = await db.query.users.findFirst({
    where: (user, { eq }) => {
      return or(
        eq(sql`LOWER(${user.email})`, input),
        eq(sql`LOWER(${user.username})`, input)
      );
    },
  });

  if (!userFound) {
    console.error("No user found with the provided email/username");
    return null;
  }

  // Handle null hashedPassword (shouldn't happen in practice)
  if (!userFound.hashedPassword) {
    console.error("User has no password set");
    return null;
  }

  const isValid = await isPasswordValid(userFound.hashedPassword, password);
  if (!isValid) {
    console.error("Invalid password provided");
    return null;
  }

  return userFound;
} 