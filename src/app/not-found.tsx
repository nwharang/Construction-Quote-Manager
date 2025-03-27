import { Button } from "@nextui-org/react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-bold">Page Not Found</h2>
      <p className="text-default-600">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button as={Link} href="/" color="primary">
        Return Home
      </Button>
    </div>
  );
} 