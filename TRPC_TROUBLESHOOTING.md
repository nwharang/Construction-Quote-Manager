# tRPC Troubleshooting Guide

This document contains common issues and solutions when working with tRPC in this project.

## Common Issues

### 1. Server-Side Rendering (SSR) Issues

tRPC can sometimes have issues with Next.js SSR, particularly with the app router. Our current setup uses the pages router with `ssr: false` in the tRPC configuration to avoid these issues.

**Solution:**
- Ensure `ssr: false` is set in the tRPC configuration (in `src/utils/api.ts`)
- Use `useEffect` hooks for managing side effects after components mount
- Use the `isBrowser()` helper function to guard against SSR-related issues

### 2. "Failed to fetch" Errors

If you see errors like:

```
TRPCClientError: Failed to fetch quotes
```

This is typically a network-related issue where the client cannot connect to the tRPC API endpoint.

**Solution:**
- Check your internet connection
- Verify the server is running
- Look for CORS issues in the browser developer console
- Inspect the Network tab in dev tools to see if requests are being blocked
- Use the enhanced error handling in our application which provides retry mechanisms
- Check server logs for any backend errors

**Implementation:**
- Our application includes specialized error handling for network issues in `src/utils/error-handler.ts`
- The `handleNetworkError` function detects common network-related issues
- Error components provide retry buttons to attempt the request again
- The API client has an improved retry configuration in `src/utils/api.ts`

### 3. useState Hook Errors

If you see errors like:

```
useState only works in Client Components. Add the "use client" directive at the top of the file to use it.
```

**Solution:**
- For Next.js app router: Add `"use client"` at the top of components using React hooks
- For pages router: Ensure components are not being used in a server-side context

### 4. Type Errors

When working with tRPC, TypeScript errors may occur, especially when:
- Accessing properties that might not exist
- Missing type definitions
- Incompatible types between client and server

**Solution:**
- Use proper type guards and optional chaining
- Import types with `import type` syntax
- Use the provided type helpers (`RouterInputs` and `RouterOutputs`)

### 5. API Call Errors

If API calls are failing with errors:

**Solution:**
- Check the API endpoints in the Network tab of dev tools
- Use the error handling utilities in `src/utils/trpc-error-handler.ts`
- Add proper error boundaries in your components
- Verify your authentication state

### 6. Context Errors

If you encounter errors related to the tRPC context:

**Solution:**
- Ensure the context is being properly created and passed
- Check authentication state for protected procedures
- Verify that the session is available in the context

## Best Practices

1. Always handle errors using proper error boundaries or `useEffect` with error state
2. Use the `createTRPCErrorHandler` utility for consistent error handling
3. Be mindful of SSR limitations and use `isBrowser()` when needed
4. Use `void` for promises you don't need to await
5. Prefer multiple smaller queries over large complex ones
6. Add proper loading states for better UX
7. Implement retry mechanisms for network-related errors
8. Always provide fallback UI for error states

## Additional Resources

- [Official tRPC Documentation](https://trpc.io/docs)
- [Next.js Data Fetching Documentation](https://nextjs.org/docs/pages/building-your-application/data-fetching)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview) 