"use client";

import { Skeleton } from "@heroui/react";

interface UserGreetingProps {
  userName: string | null;
}

export function UserGreeting({ userName }: UserGreetingProps) {
  if (userName === undefined) {
    return (
      <div className="flex items-center gap-2">
        <span>Welcome,</span>
        <Skeleton className="h-5 w-24 rounded-lg" />
      </div>
    );
  }
  
  if (!userName) {
    return <span>Welcome, Guest</span>;
  }
  
  return <span>Welcome, {userName}</span>;
} 