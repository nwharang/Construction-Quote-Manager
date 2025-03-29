# tRPC Configuration

This project uses tRPC with the Next.js Pages Router. The main API client is defined in `src/utils/api.ts`.

## File Structure

- `server.ts` - Server-side tRPC configuration
- `shared.ts` - Shared types between client and server
- `react.tsx` - React-specific utilities
- `client.tsx` - **IMPORTANT NOTE**: This file is designed for the App Router but we're currently using the Pages Router. This file is not used in the current implementation but is kept for future migration to App Router.

## Usage

In the Pages Router, we use the client from `utils/api.ts` which is wrapped by `api.withTRPC(MyApp)` in the `_app.tsx` file.

## Migration to App Router

When migrating to the App Router in the future:
1. Stop using the `utils/api.ts` file
2. Start using the `trpc/client.tsx` file with the `TRPCProvider` component
3. Update `_app.tsx` to remove the `api.withTRPC(MyApp)` wrapper 