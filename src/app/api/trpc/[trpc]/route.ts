import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "~/server/api/trpc";
import { appRouter } from "~/server/api/root";
import { NextRequest } from "next/server";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API
 * when handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

/**
 * This is the handler for the tRPC HTTP API endpoint.
 */
const handler = async (req: NextRequest, { params }: { params: { trpc: string } }) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
          }
        : undefined,
  });
};

export { handler as GET, handler as POST };
