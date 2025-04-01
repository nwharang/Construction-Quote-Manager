/**
 * This is the API client for the tRPC API using the Next.js Pages Router
 */
import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';
import superjson from 'superjson';
import fetchPonyfill from 'fetch-ponyfill';

import { type AppRouter } from '~/server/api/root';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

const { fetch } = fetchPonyfill();

/**
 * Safely determine if we're in a browser environment
 * This helps prevent issues with SSR/SSG
 */
export const isBrowser = () => typeof window !== 'undefined';

/** A set of type-safe react-query hooks for your tRPC API. */
export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      /**
       * Links used to determine how to communicate with the server.
       * @see https://trpc.io/docs/links
       */
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          // Use fetch-ponyfill to fix request issues
          fetch: fetch,
          headers: () => {
            return {
              // Add any required headers
              'x-trpc-source': 'client',
            };
          },
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: Infinity, // 30 seconds by default for more frequent refresh
            refetchOnWindowFocus: false, // Refresh data when window regains focus
            refetchOnReconnect: false, // Refresh when reconnecting
            refetchOnMount: false, // Refresh when component mounts
            // Set up retry behavior
            retry: false,
          },
          mutations: {
            retry: false,
          },
        },
      },
      abortOnUnmount: true, // Important for proper cleanup
      // Custom query options for specific queries
      queryOptions: {},
    };
  },
  transformer: superjson,
  /**
   * Set to false for maximum compatibility with Next.js
   * @see https://trpc.io/docs/nextjs#ssr-boolean-default-true
   */
  ssr: false,
});

/**
 * Inference helper for inputs.
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
