import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '~/server/api/root';
import { createTRPCContext } from '~/server/api/trpc';

// Export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: ({ req, res }) => createTRPCContext({ req, res }),
  onError: ({ path, error }) => {
    // Always log errors, regardless of environment
    console.error(`❌ tRPC error on ${path ?? '<no-path>'}: ${error.message}`);

    // Log additional details about the error
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      console.error('Error cause:', error.cause);

      // Check for database-specific errors
      if (error.cause && typeof error.cause === 'object' && 'code' in error.cause) {
        console.error('Database error code:', (error.cause as { code: string }).code);
      }
    }

    // In development mode, also log the full stack trace
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
  },
  batching: {
    enabled: true,
  },
  responseMeta() {
    // Allow CORS

    return {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    };
  },
});
