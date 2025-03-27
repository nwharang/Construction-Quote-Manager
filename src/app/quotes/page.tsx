"use client";

import { Button } from "@nextui-org/react";
import { api } from "~/utils/api";
import { QuoteList } from "~/components/quotes/QuoteList";
import { CreateQuoteModal } from "~/components/quotes/CreateQuoteModal";
import { useState } from "react";

export default function QuotesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: quotes, isLoading } = api.quotes.list.useQuery();

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quotes</h1>
        <Button
          color="primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Quote
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <QuoteList quotes={quotes ?? []} />
      )}

      <CreateQuoteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
} 