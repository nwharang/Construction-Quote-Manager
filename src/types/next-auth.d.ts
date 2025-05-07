/**
 * Type declarations for NextAuth.js to extend its default types.
 * This ensures proper TypeScript support throughout the application.
 */
import 'next-auth';

declare module 'next-auth' {
  /**
   * Extending the built-in session types with our custom fields
   */
  interface Session {
    user: {
      id: string;
      username?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    id: string;
    name: string | null;
    username?: string | null;
    email: string;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extending the JWT type with our custom fields
   */
  interface JWT {
    id: string;
    username?: string | null;
  }
}
