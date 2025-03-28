'use client';

import React from 'react';
import { Skeleton, Avatar } from '@heroui/react';
import { User } from 'lucide-react';

interface UserGreetingProps {
  userName: string | null;
}

export function UserGreeting({ userName }: UserGreetingProps) {
  if (!userName) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-24 h-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar
        name={userName}
        fallback={<User size={20} />}
        className="bg-primary/10 text-primary"
      />
      <div>
        <p className="text-sm font-medium text-foreground/90">Welcome back</p>
        <p className="text-sm text-muted-foreground/80">{userName}</p>
      </div>
    </div>
  );
}
