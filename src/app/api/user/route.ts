import { NextResponse } from "next/server";
import { getServerAuthSession } from "~/server/auth-helpers";

export async function GET() {
  const session = await getServerAuthSession();
  
  // Check if user is authenticated
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Return user data from session
  return NextResponse.json({ 
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    }
  });
} 