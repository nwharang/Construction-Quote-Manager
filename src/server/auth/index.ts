import { type DefaultSession, type NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import { compare } from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { authSchema } from "@/lib/schemas/auth";
import { env } from "@/env";
import { authConfig } from "./config";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
  }
}

export const authConfig = {
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        try {
          const { username, password } = await authSchema.parseAsync(credentials);

          const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.username, username),
          });

          if (!user || !user.hashedPassword) {
            return null;
          }

          const isValid = await compare(password, user.hashedPassword);

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            image: user.image,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: env.AUTH_SECRET,
} satisfies NextAuthConfig;

export const { auth, signIn, signOut } = NextAuth(authConfig);
