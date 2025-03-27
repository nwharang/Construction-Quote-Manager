import { Spinner } from "@nextui-org/react";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
} 