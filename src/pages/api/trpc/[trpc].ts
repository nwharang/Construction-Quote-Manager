import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '~/server/api/root';
import { createTRPCContext } from '~/server/api/trpc';

// Export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: ({ req, res }) => createTRPCContext({ req, res }),
  onError:
    process.env.NODE_ENV === 'development'
      ? ({ path, error }) => {
          console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
          // Log additional error information for debugging
          if (error.cause) {
            console.error('Error cause:', error.cause);
          }
        }
      : undefined,
  batching: {
    enabled: true,
  },
  responseMeta({ ctx, paths, type, errors }) {
    // Allow CORS
    const newHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Set more appropriate cache headers
    if (paths?.every((path) => path.startsWith('customer.'))) {
      // Add cache control for all customer endpoints
      return {
        headers: {
          ...newHeaders,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      };
    }
    
    return { headers: newHeaders };
  },
});
