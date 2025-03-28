import "server-only";

import { appRouter, type AppRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

/**
 * Creates a server-side tRPC caller with properly constructed context
 * This is async to support Next.js 15's API changes
 */
export async function createCaller() {
  // Create a new Headers object manually without using the Next.js headers API
  // This avoids the async headers issue in Next.js 15
  const heads = new Headers();
  heads.set("x-trpc-source", "server");
  
  // Create context with our manually created headers
  const context = await createTRPCContext({
    headers: heads,
  });
  
  // Return a caller with the context
  return appRouter.createCaller(context);
}

/**
 * Export methods for server-side tRPC calls
 */
export const serverTRPC = {
  quote: {
    getAll: async () => {
      const caller = await createCaller();
      return caller.quote.getAll();
    },
    // Add other procedures as needed
  },
  // Add other routers as needed
};

/**
 * Re-export the appRouter for use in other files
 */
export { appRouter, type AppRouter };
