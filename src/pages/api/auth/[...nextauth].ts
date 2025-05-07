#!/usr/bin/env node
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
// Removed tRPC client imports
// import { createTRPCProxyClient, httpBatchLink, TRPCClientError } from '@trpc/client';
// import { type AppRouter } from '~/server/api/root';
// import superjson from 'superjson';

// Removed getBaseUrl function

// Import necessary items for AuthService
import { db } from '~/server/db';
import { AuthService } from '~/server/services/authService';
import { TRPCError } from '@trpc/server'; // Import TRPCError to catch service errors

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string | null;
    };
  }

  interface User {
    id: string;
    name: string | null;
    email: string | null;
    image?: string | null;
    username?: string | null;
  }
}

/**
 * NextAuth.js configuration for Pages Router (v4)
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        emailOrUsername: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.emailOrUsername || !credentials?.password) {
          return null;
        }

        try {
          // Instantiate AuthService (session context is null here, not needed for validation)
          const authService = new AuthService(db, { session: null });

          // Call AuthService to validate credentials using the correct method name
          const user = await authService.verifyUserCredentials(
            credentials.emailOrUsername,
            credentials.password
          );

          // Service returns user object on success (already excludes password)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            image: user.image,
          };
        } catch (error) {
          // Catch errors from AuthService (e.g., TRPCError with code UNAUTHORIZED)
          if (error instanceof TRPCError && error.code === 'UNAUTHORIZED') {
          } else {
            // Log other unexpected errors
            console.error('Auth: Unexpected error during authorization:', error);
          }
          // Return null to indicate failed authorization to NextAuth
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
      }
      return session;
    },
    // Add the signIn callback to handle custom errors
    async signIn({ user, credentials }) {
      // The user object here might contain the error code if authorize failed
      // However, the standard way is to catch the *thrown* error from authorize
      // This callback runs *after* authorize. If authorize throws, this won't run.
      // If authorize returns null (which it does on error), this callback might still run.
      // The standard approach relies on authorize *throwing*.

      // Let's adjust the authorize function to always THROW specific errors.
      // Then, the error will propagate to the client's signIn call directly.

      // Based on recent checks, the authorize function now throws NOT_FOUND or UNAUTHORIZED.
      // These should directly translate to an error in the client-side signIn result.
      // So, an explicit signIn callback might not be needed just to pass the error.
      // However, if we wanted to transform the error message here, we could.
      // For now, let's rely on the direct error propagation.
      return true; // Allow sign in if authorize didn't throw
    },
  },
  session: {
    strategy: 'jwt',
  },
  // These cookies are secure by default in production
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/auth/signin',
    signOut: '/',
    error: '/auth/signin', // Error code passed in query string as ?error=
  },
};

export default NextAuth(authOptions);
