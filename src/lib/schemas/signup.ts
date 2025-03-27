import { z } from "zod";

export const signupSchema = z
  .object({
    username: z
      .string()
      .min(2, "Username must be at least 2 characters")
      .max(50, "Username must be at most 50 characters"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .min(5, "Email must be at least 5 characters")
      .max(255, "Email must be at most 255 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be at most 100 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupSchema = z.infer<typeof signupSchema>; 