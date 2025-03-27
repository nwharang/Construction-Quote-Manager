import { type NextRequest } from "next/server";

// Define the session type
export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface GetServerAuthSessionOptions {
  req: Pick<NextRequest, "headers">;
  res: any;
}

/**
 * Basic authentication mock for development purposes
 * In a real application, this would be replaced with NextAuth.js or a similar solution
 */
export async function getServerAuthSession(options: GetServerAuthSessionOptions): Promise<Session> {
  // Simple mock session for development
  return {
    user: {
      id: "6f5e4d3c-2b1a-9876-5432-10fedcba9876", // UUID format for consistency with our schema
      name: "Demo User",
      email: "demo@example.com",
    }
  };
}

export const authOptions = {
  // Auth configuration options would go here in a real app
}; 