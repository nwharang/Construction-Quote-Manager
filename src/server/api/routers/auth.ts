import { z } from "zod";
import { hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

// Schema for user registration
const registerUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Schema for user login (for password recovery, etc.)
const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const authRouter = createTRPCRouter({
  // Get the current user profile (authorized users only)
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { session, db } = ctx;
    
    const user = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      createdAt: users.createdAt,
    }).from(users)
      .where(eq(users.id, session.user.id))
      .then(rows => rows[0]);
    
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }
    
    return user;
  }),
  
  // Create a new user (public procedure)
  register: publicProcedure
    .input(registerUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { db } = ctx;
      const { name, email, password } = input;
      
      // Check if user already exists
      const existingUsers = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.email, email.toLowerCase()));
      
      if (existingUsers.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }
      
      // Hash the password
      const hashedPassword = await hash(password, 12);
      
      // Create the user
      const [newUser] = await db.insert(users)
        .values({
          name,
          email: email.toLowerCase(),
          hashedPassword,
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
        });
        
      return {
        status: "success",
        user: newUser,
      };
    }),
    
  // Update user profile (authorized users only)
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).optional(),
      image: z.string().url().nullish(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { session, db } = ctx;
      
      const dataToUpdate: Record<string, unknown> = {};
      
      if (input.name) dataToUpdate.name = input.name;
      if (input.image !== undefined) dataToUpdate.image = input.image;
      
      // Only proceed if there are fields to update
      if (Object.keys(dataToUpdate).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No valid fields to update",
        });
      }
      
      // Update the user
      const [updatedUser] = await db.update(users)
        .set({
          ...dataToUpdate,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        });
        
      return {
        status: "success",
        user: updatedUser,
      };
    }),
}); 