import { object, string } from "zod";

export const signInSchema = object({
  emailOrUsername: string({ required_error: "Email or username is required" })
    .min(2, "Email or username must be at least 2 characters")
    .max(255, "Email or username must be less than 255 characters")
    .transform((str) => str.toLowerCase()),
  password: string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must be less than 32 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});
