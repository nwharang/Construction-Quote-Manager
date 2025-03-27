"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  Divider,
} from "@nextui-org/react";
import { Eye, EyeOff, UserPlus } from "lucide-react";

// Form validation schema
const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(8, { message: "Please confirm your password" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      // In a real app, you would make an API call to register the user
      // For this demo, we'll simulate success and then sign in
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // After successful registration, automatically sign in
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      
      if (result?.error) {
        setAuthError("Registration successful, but unable to sign in automatically. Please sign in manually.");
      } else {
        router.push("/quotes");
      }
    } catch (error) {
      setAuthError("An unexpected error occurred. Please try again.");
      console.error("Sign up error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4" aria-labelledby="signup-heading">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1">
          <h1 id="signup-heading" className="text-2xl font-bold">Create Account</h1>
          <p className="text-default-500">Sign up to start creating quotes</p>
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
                type="text"
                label="Name"
                labelPlacement="outside"
                placeholder="Enter your full name"
                {...register("name")}
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
                autoComplete="name"
                aria-required="true"
                aria-describedby={errors.name ? "name-error" : undefined}
                classNames={{
                  label: "font-medium",
                }}
                fullWidth
              />
              {errors.name && (
                <span id="name-error" className="sr-only">
                  {errors.name.message}
                </span>
              )}
            </div>
            
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
                placeholder="Create a password"
                {...register("password")}
                isInvalid={!!errors.password}
                errorMessage={errors.password?.message}
                autoComplete="new-password"
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
            
            <div className="space-y-1">
              <Input
                label="Confirm Password"
                labelPlacement="outside"
                placeholder="Confirm your password"
                {...register("confirmPassword")}
                isInvalid={!!errors.confirmPassword}
                errorMessage={errors.confirmPassword?.message}
                autoComplete="new-password"
                aria-required="true"
                aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                endContent={
                  <Button
                    variant="light"
                    isIconOnly
                    tabIndex={-1}
                    onClick={toggleConfirmVisibility}
                    type="button"
                    aria-label={isConfirmVisible ? "Hide password" : "Show password"}
                  >
                    {isConfirmVisible ? (
                      <EyeOff className="h-4 w-4 text-default-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-default-400" />
                    )}
                  </Button>
                }
                type={isConfirmVisible ? "text" : "password"}
                classNames={{
                  label: "font-medium",
                }}
                fullWidth
              />
              {errors.confirmPassword && (
                <span id="confirm-password-error" className="sr-only">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>
          </CardBody>
          
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              color="primary"
              fullWidth
              isLoading={isLoading}
              startContent={!isLoading && <UserPlus className="h-4 w-4" />}
              aria-label="Create your account"
            >
              Sign Up
            </Button>
            
            <Divider className="my-2" />
            
            <p className="text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="text-primary hover:underline"
                aria-label="Sign in to your existing account"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
