import React from 'react';
import { type NextPage } from 'next';
import Head from 'next/head';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '~/utils/api';
import { routes } from '~/config/routes';
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Link,
  Checkbox,
  Select,
  SelectItem,
  CardFooter,
} from '@heroui/react';
import { AuthLayout } from '~/layouts';
import { withAuthLayout } from '~/utils/withAuth';

type UserRole = 'contractor' | 'subcontractor' | 'supplier' | 'other';

const SignUp: NextPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'contractor' as UserRole,
    acceptTerms: false,
    receiveUpdates: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // tRPC mutation for registration
  const { mutate: register } = api.auth.register.useMutation({
    onSuccess: async () => {
      // After successful registration, sign in automatically
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        // Redirect to dashboard
        await router.push(routes.admin.dashboard);
      }
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // Call tRPC register mutation
      register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
    } catch (error) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold">Sign Up</h2>
        <p className="text-sm text-gray-500">Create your account to get started</p>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <Input
            label="Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            isRequired
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            isRequired
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            isRequired
          />
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            isRequired
          />

          <Button type="submit" color="primary" className="w-full" isLoading={isLoading}>
            Sign Up
          </Button>
        </form>
      </CardBody>
      <CardFooter>
        <div className="relative z-10">
          <p className="text-sm opacity-80">
            Already have an account?{' '}
            <Link href={routes.auth.signIn} className="underline hover:opacity-100 text-sm">
              Sign in
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

// Pass title "Sign Up" to the HOC
export default withAuthLayout(SignUp, "Sign Up");
