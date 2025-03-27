import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { headers } from "next/headers";
import { cache } from "react";

import { type AppRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { createQueryClient } from "./query-client";
import { appRouter } from "@/server/api/root";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const headersData = headers();
  const heads = new Headers();
  
  // Copy headers from the headers() result
  for (const [key, value] of headersData.entries()) {
    heads.set(key, value);
  }
  
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

const getQueryClient = cache(createQueryClient);
const caller = appRouter.createCaller(await createContext());

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  { router: appRouter, createContext: createContext },
  getQueryClient,
);
