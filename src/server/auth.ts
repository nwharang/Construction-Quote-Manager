import { type GetServerSidePropsContext } from "next";
import {
  getServerSession as nextAuthGetServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
    } & DefaultSession["user"];
  }
}

// Define the session type
export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface GetServerAuthSessionOptions {
  req: Pick<NextRequest, "headers">;
  res: any;
}

/**
 * Basic authentication mock for development purposes
 * In a real application, this would be replaced with NextAuth.js or a similar solution
 */
export async function getServerAuthSession(options: GetServerAuthSessionOptions): Promise<Session> {
  // Simple mock session for development
  return {
    user: {
      id: "user-id-123",
      name: "Demo User",
      email: "demo@example.com",
    }
  };
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const user = await db.query.users.findFirst({
            where: eq(users.username, credentials.username),
          });

          if (!user || !user.password) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.username,
            email: "",
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
};

// For use in API routes and server components
export const getServerAuthSession = async (options: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  // Mock auth for development
  if (process.env.NODE_ENV === "development") {
    // Return a mock session for development
    return {
      user: {
        id: "user-id-123",
        name: "Demo User",
        email: "demo@example.com",
      }
    };
  }
  
  return nextAuthGetServerSession(options.req, options.res, authOptions);
}; 