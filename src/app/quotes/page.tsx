"use client";

import { api } from "~/utils/api";
import { useState } from "react";
import { Button, Spinner } from "@nextui-org/react";
import QuoteList from "~/components/quotes/QuoteList";
import { CreateQuoteModal } from "~/components/quotes/CreateQuoteModal";

export default function QuotesPage() {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const quotesQuery = api.quote.getAll.useQuery();

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quotes</h1>
        <Button 
          color="primary" 
          onPress={() => setCreateModalOpen(true)}
        >
          Create New Quote
        </Button>
      </div>

      {quotesQuery.isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : quotesQuery.error ? (
        <p className="text-danger">Error loading quotes: {quotesQuery.error.message}</p>
      ) : quotesQuery.data?.length === 0 ? (
        <p className="text-center text-gray-500">No quotes found. Create your first quote!</p>
      ) : (
        <QuoteList quotes={quotesQuery.data || []} />
      )}

      <CreateQuoteModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
      />
    </div>
  );
} 