import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "~/server/api/root";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerAuthSession } from "~/server/auth/session";
import { db } from "~/server/db";

// Export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: async ({ req, res }) => {
    // Get the session using NextAuth
    const session = await getServerAuthSession();
    
    return {
      session,
      db,
      headers: req.headers as unknown as Headers,
    };
  },
  onError:
    process.env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(
            `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
          );
        }
      : undefined,
}); 