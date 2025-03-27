"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardBody, CardHeader } from "@nextui-org/react";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  let title = "Authentication Error";
  let message = "An error occurred during authentication.";

  switch (error) {
    case "Signin":
      message = "Try signing in with a different account.";
      break;
    case "OAuthSignin":
      message = "Try signing in with a different provider.";
      break;
    case "OAuthCallback":
      message = "Try signing in with a different provider.";
      break;
    case "OAuthCreateAccount":
      message = "Try signing in with a different provider.";
      break;
    case "EmailCreateAccount":
      message = "Try signing in with a different email address.";
      break;
    case "Callback":
      message = "Try signing in with a different provider.";
      break;
    case "OAuthAccountNotLinked":
      message =
        "To confirm your identity, sign in with the same account you used originally.";
      break;
    case "EmailSignin":
      message = "Check your email address.";
      break;
    case "CredentialsSignin":
      message = "Sign in failed. Check the details you provided are correct.";
      break;
    case "SessionRequired":
      title = "Access Denied";
      message = "Please sign in to access this page.";
      break;
    default:
      break;
  }

  return (
    <div className="container mx-auto grid min-h-[calc(100dvh-4rem)] max-w-md place-items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader className="flex flex-col gap-1 px-6 py-6">
          <h1 className="text-2xl font-bold text-danger">{title}</h1>
          <p className="text-default-500">{message}</p>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <Button
            as={Link}
            href="/auth/signin"
            color="primary"
            className="w-full"
          >
            Back to Sign In
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
