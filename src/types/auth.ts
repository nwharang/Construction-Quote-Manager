/**
 * Auth related types
 */

export interface User {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  expires: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface UserWithoutPassword extends Omit<User, 'password'> {
  password?: never;
}

export interface AuthError {
  message: string;
  status: number;
  code?: string;
} 