import "server-only";

import { appRouter, type AppRouter } from "~/server/api/root";
import { createInnerTRPCContext } from "~/server/api/trpc";
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Creates a server-side tRPC caller with properly constructed context
 * for calling procedures from server-side code (e.g., NextAuth authorize).
 */
export async function createCaller() {
  // Create minimal placeholder req/res objects.
  // These might not be fully functional for all context needs,
  // but are sufficient for createInnerTRPCContext to provide the db instance.
  const req = {} as NextApiRequest;
  const res = {} as NextApiResponse;

  // Create context using the Pages Router context function
  const context = await createInnerTRPCContext({
    req,
    res,
    // No actual session or full request details needed for this server-side call
  });

  // Return a caller with the context
  return appRouter.createCaller(context);
}

/**
 * Re-export the appRouter for use in other files if needed elsewhere
 * (though createCaller is the primary intended use from this file)
 */
export { appRouter, type AppRouter };
