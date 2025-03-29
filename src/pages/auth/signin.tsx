import React from 'react';
import { type NextPage } from 'next';
import Head from 'next/head';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '~/utils/api';
import { routes } from '~/config/routes';
import { Card, CardBody, CardHeader, Input, Button, Link, CardFooter } from '@heroui/react';

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
    <>
      <div className="min-h-dvh flex">
        <Head>
          <title>Sign In | Construction Quote Manager</title>
        </Head>

        {/* Left Column (hidden on mobile) */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white flex-col justify-between p-8 relative overflow-hidden">
          {/* Background blobs for visual effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
            <p className="text-lg opacity-90">
              Sign in to manage your construction quotes and projects.
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold">Sign In</h2>
              <p className="text-sm text-gray-500">Enter your credentials to access your account</p>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="text-red-500 text-sm">{error}</div>}
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
                <p className="opacity-80 text-sm">
                  Don&apos;t have an account?{' '}
                  <Link href={routes.auth.signUp} className="underline hover:opacity-100 text-sm">
                    Sign up
                  </Link>
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SignIn;
