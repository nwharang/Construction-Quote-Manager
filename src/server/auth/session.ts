/**
 * Server-side authentication utils.
 * 
 * These functions should only be used in server components or server actions.
 */
import { getServerSession } from "next-auth";
import { type Session } from "next-auth";
import { authOptions } from "~/pages/api/auth/[...nextauth]";
import type { GetServerSidePropsContext } from "next";
import type { NextApiRequest, NextApiResponse } from "next";

type ContextWithReqRes = {
  req: NextApiRequest | GetServerSidePropsContext["req"];
  res: NextApiResponse | GetServerSidePropsContext["res"];
} | undefined;

/**
 * Get the session on the server
 */
export async function getServerAuthSession(context?: ContextWithReqRes): Promise<Session | null> {
  if (!context) {
    return null;
  }

  try {
    return await getServerSession(context.req, context.res, authOptions);
  } catch (error) {
    console.error("Error getting server session:", error);
    return null;
  }
} 