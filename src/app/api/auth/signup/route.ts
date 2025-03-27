import { NextResponse } from "next/server";
import { authSchema } from "@/lib/schemas/auth";
import { db } from "@/server/db";
import { hashPassword } from "@/server/auth/password";

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

    const existingUser = await db.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await db.user.create({
      data: {
        username,
        password: hashedPassword,
      },
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
