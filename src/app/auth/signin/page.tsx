"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Checkbox,
  Divider,
} from "@nextui-org/react";
import { Eye, EyeOff, LogIn } from "lucide-react";

// Form validation schema
const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  remember: z.boolean().optional(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/quotes";
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const toggleVisibility = () => setIsVisible(!isVisible);

  const onSubmit = async (data: SignInFormValues) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl,
      });
      
      if (result?.error) {
        setAuthError("Invalid email or password. Please try again.");
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      setAuthError("An unexpected error occurred. Please try again.");
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4" aria-labelledby="signin-heading">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1">
          <h1 id="signin-heading" className="text-2xl font-bold">Sign In</h1>
          <p className="text-default-500">Welcome back to Construction Quote Manager</p>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardBody className="gap-4">
            {authError && (
              <div 
                className="rounded-lg bg-danger-50 p-3 text-danger text-sm" 
                role="alert"
                aria-live="assertive"
              >
                {authError}
              </div>
            )}
            
            <div className="space-y-1">
              <Input
                type="email"
                label="Email"
                labelPlacement="outside"
                placeholder="Enter your email"
                {...register("email")}
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
                autoComplete="email"
                aria-required="true"
                aria-describedby={errors.email ? "email-error" : undefined}
                classNames={{
                  label: "font-medium",
                }}
                fullWidth
              />
              {errors.email && (
                <span id="email-error" className="sr-only">
                  {errors.email.message}
                </span>
              )}
            </div>
            
            <div className="space-y-1">
              <Input
                label="Password"
                labelPlacement="outside"
                placeholder="Enter your password"
                {...register("password")}
                isInvalid={!!errors.password}
                errorMessage={errors.password?.message}
                autoComplete="current-password"
                aria-required="true"
                aria-describedby={errors.password ? "password-error" : undefined}
                endContent={
                  <Button
                    variant="light"
                    isIconOnly
                    tabIndex={-1}
                    onClick={toggleVisibility}
                    type="button"
                    aria-label={isVisible ? "Hide password" : "Show password"}
                  >
                    {isVisible ? (
                      <EyeOff className="h-4 w-4 text-default-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-default-400" />
                    )}
                  </Button>
                }
                type={isVisible ? "text" : "password"}
                classNames={{
                  label: "font-medium",
                }}
                fullWidth
              />
              {errors.password && (
                <span id="password-error" className="sr-only">
                  {errors.password.message}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <Checkbox {...register("remember")} aria-label="Remember me">
                <span className="text-sm">Remember me</span>
              </Checkbox>
              
              <Button
                as={Link}
                href="/auth/forgot-password"
                variant="light"
                className="p-0 text-sm"
                aria-label="Reset your password"
              >
                Forgot password?
              </Button>
            </div>
          </CardBody>
          
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              color="primary"
              fullWidth
              isLoading={isLoading}
              startContent={!isLoading && <LogIn className="h-4 w-4" />}
              aria-label="Sign in to your account"
            >
              Sign In
            </Button>
            
            <Divider className="my-2" />
            
            <p className="text-center text-sm">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-primary hover:underline"
                aria-label="Create a new account"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
