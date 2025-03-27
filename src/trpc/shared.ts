export function getUrl() {
  // If the VERCEL_URL environment variable is defined, use it
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/trpc`;
  }
  // If we're running in development, use the local server
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000/api/trpc";
  }
  // Otherwise, assume we're running in production
  return "/api/trpc";
} 