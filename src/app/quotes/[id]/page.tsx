"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { api } from "~/utils/api";
import { Button, Spinner } from "@nextui-org/react";
import QuoteDetail from "~/components/quotes/QuoteDetail";
import AddTaskModal from "~/components/quotes/AddTaskModal";

export default function QuotePage({ params }: { params: { id: string } }) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const quoteQuery = api.quote.getById.useQuery({ id: params.id });

  if (quoteQuery.isPending) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!quoteQuery.data) {
    return notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quote Details</h1>
        <Button 
          color="primary" 
          onPress={() => setIsTaskModalOpen(true)}
        >
          Add Task
        </Button>
      </div>

      <QuoteDetail quote={quoteQuery.data} />

      <AddTaskModal 
        quoteId={params.id} 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
      />
    </div>
  );
} 