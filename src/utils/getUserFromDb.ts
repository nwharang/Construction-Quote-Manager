import { db } from "@/server/db";
import { lower } from "@/server/db/schema";
import { or } from "drizzle-orm";
import { isPasswordValid } from "./password";

export async function getUserFromDb(emailOrUsername: string, password: string) {
  const input = emailOrUsername.toLowerCase();

  const userFound = await db.query.users.findFirst({
    where: (user, { eq }) => {
      return or(
        eq(lower(user.email), input),
        eq(lower(user.username), input)
      );
    },
  });

  if (!userFound) {
    console.error("No user found with the provided email/username");
    return null;
  }

  const isValid = await isPasswordValid(userFound.hashedPassword, password);
  if (!isValid) {
    console.error("Invalid password provided");
    return null;
  }

  return userFound;
}
