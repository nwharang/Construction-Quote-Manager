/**
 * Server-side authentication utils.
 * 
 * These functions should only be used in server components or server actions.
 */
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "~/pages/api/auth/[...nextauth]";

/**
 * Get the session on the server
 */
export async function getServerAuthSession(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("Error getting server session:", error);
    return null;
  }
} 