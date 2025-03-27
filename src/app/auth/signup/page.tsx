"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Link as NextUILink,
} from "@nextui-org/react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { authSchema } from "@/lib/schemas/auth";
import type { AuthSchema } from "@/lib/schemas/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthSchema>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthSchema) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error("Registration failed", {
          description: result.message || "Please try again.",
        });
        return;
      }

      toast.success("Account created!", {
        description: "Please sign in with your new account.",
      });

      const signInResult = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.error("Authentication failed", {
          description: "Please try signing in manually.",
        });
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto grid min-h-[calc(100dvh-4rem)] max-w-md place-items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader className="flex flex-col gap-1 px-6 py-6">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-default-500">
            Sign up to get started with our platform
          </p>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              {...register("username")}
              label="Username"
              placeholder="Choose a username"
              errorMessage={errors.username?.message}
              isInvalid={!!errors.username}
              isDisabled={isLoading}
            />
            <Input
              {...register("password")}
              label="Password"
              placeholder="Choose a password"
              type={isVisible ? "text" : "password"}
              errorMessage={errors.password?.message}
              isInvalid={!!errors.password}
              isDisabled={isLoading}
              endContent={
                <Button
                  isIconOnly
                  variant="light"
                  onClick={() => setIsVisible(!isVisible)}
                >
                  {isVisible ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </Button>
              }
            />
            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              className="mt-2"
            >
              Sign Up
            </Button>
            <p className="text-center text-sm text-default-500">
              Already have an account?{" "}
              <NextUILink as={Link} href="/auth/signin" size="sm">
                Sign in
              </NextUILink>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
