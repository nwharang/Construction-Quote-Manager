import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { type Session } from "next-auth";
import { authOptions } from "~/app/api/auth/[...nextauth]/route";

/**
 * Get the user's session on the server
 */
export async function getServerAuthSession(): Promise<Session | null> {
  return await getServerSession(authOptions);
}

/**
 * Check if a user is authenticated on the server
 * Returns the user session if authenticated, otherwise throws an error
 */
export async function requireAuth(): Promise<Session> {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new Error("Not authenticated");
  }
  
  return session;
}

/**
 * Redirect to login if not authenticated
 * Use in server components to protect routes
 */
export async function redirectIfNotAuthenticated(loginPath = "/auth/signin"): Promise<Session> {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect(loginPath);
  }
  
  return session;
}

/**
 * Redirect to a specified path if already authenticated
 * Use in auth pages to prevent authenticated users from accessing login/signup
 */
export async function redirectIfAuthenticated(redirectPath = "/quotes"): Promise<void> {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect(redirectPath);
  }
} 