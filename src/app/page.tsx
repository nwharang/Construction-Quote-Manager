"use client";
import { Button } from "@nextui-org/react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12 text-center">
      <h1 className="text-4xl font-bold sm:text-5xl">
        Welcome to Quote Manager
      </h1>
      <p className="max-w-2xl text-lg text-default-600">
        Create and manage professional job quotes for your construction projects.
        Track tasks, materials, and costs all in one place.
      </p>
      <div className="flex gap-4">
        <Button as={Link} href="/quotes" color="primary" size="lg">
          View Quotes
        </Button>
        <Button as={Link} href="/quotes/new" variant="bordered" size="lg">
          Create New Quote
        </Button>
      </div>
    </div>
  );
}
