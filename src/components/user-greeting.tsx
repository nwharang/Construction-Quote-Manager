"use client";

import { useSession } from "next-auth/react";
import { Skeleton } from "@nextui-org/react";

export function UserGreeting() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <span>Welcome,</span>
        <Skeleton className="h-5 w-24 rounded-lg" />
      </div>
    );
  }
  
  if (!session) {
    return <span>Welcome, Guest</span>;
  }
  
  return <span>Welcome, {session.user.name || "User"}</span>;
} 