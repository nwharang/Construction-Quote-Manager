"use client";

import { useSession } from "next-auth/react";
import { Card, CardBody } from "@nextui-org/react";

export function WelcomeMessage() {
  const { data: session } = useSession();

  return (
    <Card className="mb-8">
      <CardBody>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Welcome to TTXD App
        </h1>
        <p className="text-lg text-default-500">
          {session ? (
            <>
              Welcome back, {session.user.name || session.user.username || "User"}! 
              This is your dashboard where you can manage your tasks and stay organized.
            </>
          ) : (
            <>
              Please sign in to access all features and manage your tasks efficiently.
              We&apos;re here to help you stay organized and productive.
            </>
          )}
        </p>
      </CardBody>
    </Card>
  );
} 