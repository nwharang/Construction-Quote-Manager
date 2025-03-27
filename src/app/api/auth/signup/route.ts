import { NextResponse } from "next/server";
import { z } from "zod";

// In-memory store for demo users
const users = [
  {
    id: "1",
    username: "demo",
    // Password: Abc123!@#
    passwordHash: "$2a$10$Oi5yhIQYyUNePt4tVUX.1.OVvU9/Z0YZKbCjE88FExbHxnKPrc0Bu",
    name: "Demo User",
    email: "demo@example.com",
  },
];

// Auth schema
const authSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = authSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          message: "Invalid request body",
          errors: parsedBody.error.errors,
        },
        { status: 400 }
      );
    }

    const { username, password } = parsedBody.data;

    // Check if user exists
    const existingUser = users.find(user => user.username === username);

    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 409 }
      );
    }

    // In a real app, we would hash the password and store in DB
    // For demo, just pretend we did
    const newUserId = (users.length + 1).toString();
    
    // Simulate adding a user to the database
    users.push({
      id: newUserId,
      username,
      passwordHash: "hashed_password_would_go_here",
      name: username,
      email: `${username}@example.com`,
    });

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in signup route:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
