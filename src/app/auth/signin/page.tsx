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

export default function SignInPage() {
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
      const result = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Authentication failed", {
          description: "Please check your credentials and try again.",
        });
        return;
      }

      toast.success("Welcome back!", {
        description: "You have been successfully signed in.",
      });
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
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-default-500">
            Sign in to your account to continue
          </p>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              {...register("username")}
              label="Username"
              placeholder="Enter your username"
              errorMessage={errors.username?.message}
              isInvalid={!!errors.username}
              isDisabled={isLoading}
            />
            <Input
              {...register("password")}
              label="Password"
              placeholder="Enter your password"
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
              Sign In
            </Button>
            <p className="text-center text-sm text-default-500">
              Don&apos;t have an account?{" "}
              <NextUILink as={Link} href="/auth/signup" size="sm">
                Sign up
              </NextUILink>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
