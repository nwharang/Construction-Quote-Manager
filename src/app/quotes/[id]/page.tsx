"use client";

import { notFound } from "next/navigation";
import { api } from "~/utils/api";
import { QuoteDetail } from "~/components/quotes/QuoteDetail";
import { AddTaskModal } from "~/components/quotes/AddTaskModal";
import { Button } from "@nextui-org/react";
import { useState } from "react";

interface QuotePageProps {
  params: {
    id: string;
  };
}

export default function QuotePage({ params }: QuotePageProps) {
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const { data: quote, isLoading } = api.quotes.getById.useQuery(params.id);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!quote) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quote Details</h1>
        <Button
          color="primary"
          onClick={() => setIsAddTaskModalOpen(true)}
        >
          Add Task
        </Button>
      </div>

      <QuoteDetail quote={quote} />

      <AddTaskModal
        quoteId={quote.id}
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
      />
    </div>
  );
} 