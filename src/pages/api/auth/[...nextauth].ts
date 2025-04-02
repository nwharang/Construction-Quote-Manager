#!/usr/bin/env node
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
// Removed tRPC client imports
// import { createTRPCProxyClient, httpBatchLink, TRPCClientError } from '@trpc/client';
// import { type AppRouter } from '~/server/api/root';
// import superjson from 'superjson';

// Removed getBaseUrl function

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
    };
  }

  interface User {
    id: string;
    name: string | null;
    email: string | null;
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
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Re-add direct import of getUserFromDb
        const { getUserFromDb } = await import('~/server/utils/get-user-from-db');

        if (!credentials?.email || !credentials?.password) {
          console.log('Auth: Missing credentials');
          return null;
        }

        // Remove temporary client creation

        try {
          // Revert to calling getUserFromDb directly
          const user = await getUserFromDb(credentials.email, credentials.password);

          if (!user) {
            console.log('Auth: getUserFromDb returned null (user not found or invalid password)');
            return null;
          }

          console.log(`Auth: User ${user.email} authorized successfully`);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };

        } catch (error) {
          // Simplified error handling for direct call
          console.error('Error during direct authorization call:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
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
