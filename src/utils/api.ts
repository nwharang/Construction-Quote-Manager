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
            staleTime: 30 * 1000, // 30 seconds by default for more frequent refresh
            refetchOnWindowFocus: true, // Refresh data when window regains focus
            refetchOnReconnect: true, // Refresh when reconnecting
            refetchOnMount: true, // Refresh when component mounts
            // Set up retry behavior
            retry: (failureCount, error) => {
              // Don't retry on 404s and authorization errors
              if (
                typeof error === 'object' && 
                error !== null && 
                'message' in error &&
                (
                  String(error.message).includes('UNAUTHORIZED') || 
                  String(error.message).includes('NOT_FOUND')
                )
              ) {
                return false;
              }
              // Retry up to 3 times for other errors with exponential backoff
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 1,
          },
        },
      },
      abortOnUnmount: true, // Important for proper cleanup
      // Custom query options for specific queries
      queryOptions: {
        'settings.get': {
          staleTime: 5 * 60 * 1000, // Cache settings for 5 minutes
          gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        },
      },
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
