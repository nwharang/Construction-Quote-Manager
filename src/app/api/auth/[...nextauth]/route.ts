import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { compare, hash } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // @ts-expect-error - NextAuth types are not fully compatible with our setup
      async authorize(credentials, req) {
        // Validate the credentials with zod
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(8),
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;

        // For development purposes, create a user if it doesn't exist
        // In production, you would have a proper signup flow
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        // For demo purposes, we'll create test users automatically
        // In a real app, you would remove this and have a proper registration flow
        if (!existingUser && (email === "demo@example.com" || email === "test@example.com")) {
          const hashedPassword = await hash(password, 10);
          const insertResult = await db
            .insert(users)
            .values({
              email,
              name: email === "demo@example.com" ? "Demo User" : "Test User",
            })
            .returning();
            
          const newUser = insertResult[0];
          
          if (!newUser) {
            throw new Error("Failed to create user");
          }

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          };
        }

        if (!existingUser) return null;

        // In a real implementation, you would verify the password hash
        // For this demo, we'll accept any password for the demo user
        if (email === "demo@example.com" || email === "test@example.com") {
          return {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
