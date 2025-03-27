"use client";

import { Button } from "@nextui-org/react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-default-600">
        {error.message || "An unexpected error occurred"}
      </p>
      <Button onClick={reset} color="primary">
        Try again
      </Button>
    </div>
  );
} 