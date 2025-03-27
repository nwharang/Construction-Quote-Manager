import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req) {
    // If the user is authenticated and trying to access auth pages, redirect to home
    if (req.nextUrl.pathname.startsWith("/auth/") && req.nextauth.token) {
      return NextResponse.redirect(new URL("/quotes", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protection patterns
        const isAuthRoute = req.nextUrl.pathname.startsWith("/auth");
        const isApiRoute = req.nextUrl.pathname.startsWith("/api");
        const isPublicRoute = 
          req.nextUrl.pathname === "/" || 
          req.nextUrl.pathname.startsWith("/_next") ||
          req.nextUrl.pathname.startsWith("/static");
        
        // Public routes and auth routes don't need authentication
        if (isPublicRoute || isAuthRoute) {
          return true;
        }
        
        // API routes have their own auth checks
        if (isApiRoute && !req.nextUrl.pathname.startsWith("/api/auth")) {
          return true;
        }
        
        // For all other routes, require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  // Specify the paths that this middleware should run on
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public resources)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/trpc).*)",
  ],
}; 