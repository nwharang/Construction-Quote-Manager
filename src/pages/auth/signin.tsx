import React from 'react';
import { type NextPage } from 'next';
import Head from 'next/head';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '~/utils/api';
import { routes } from '~/config/routes';
import { Card, CardBody, CardHeader, Input, Button, Link, CardFooter } from '@heroui/react';
import { withAuthLayout } from '~/utils/withAuth';

const SignIn: NextPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // tRPC mutation for login
  const { mutate: login } = api.auth.login.useMutation({
    onSuccess: async () => {
      // After successful login, sign in with NextAuth
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      // Call tRPC login mutation
      login({
        email: formData.email,
        password: formData.password,
      });
    } catch (error) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold">Sign In</h2>
        <p className="text-sm text-gray-500">Enter your credentials to access your account</p>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-500">{error}</div>}
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
          <Button type="submit" color="primary" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>
      </CardBody>
      <CardFooter>
        <div className="relative z-10">
          <p className="text-sm opacity-80">
            Don&apos;t have an account?{' '}
            <Link href={routes.auth.signUp} className="text-sm underline hover:opacity-100">
              Sign up
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

// Pass title "Sign In" to the HOC
export default withAuthLayout(SignIn, 'Sign In');
