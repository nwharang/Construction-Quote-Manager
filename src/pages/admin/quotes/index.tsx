'use client';

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Spinner,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
} from '@heroui/react';
import { api } from '~/utils/api';
import { useEntityCrud } from '~/hooks/useEntityCrud';
import { useTranslation } from '~/hooks/useTranslation';
import { Layout } from '~/components/Layout';
import { EntityList, type EntityColumn } from '~/components/shared/EntityList';
import { useEntityStore, useToastStore } from '~/store';
import { formatUserFriendlyId } from '~/utils/formatters';

// Map status to display settings
const QuoteStatusSettings = {
  DRAFT: { color: 'default' as const, label: 'Draft' },
  SENT: { color: 'primary' as const, label: 'Sent' },
  ACCEPTED: { color: 'success' as const, label: 'Accepted' },
  REJECTED: { color: 'danger' as const, label: 'Rejected' },
};

// Define API Quote type
interface Quote {
  id: string;
  sequentialId: number;
  title: string;
  status: keyof typeof QuoteStatusSettings;
  customerName: string;
  customerEmail?: string | null;
  createdAt: Date;
  updatedAt: Date;
  grandTotal: number;
}

export default function QuotesPage() {
  const router = useRouter();
  const { status } = useSession();
  const { formatCurrency, formatDate } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const entityStore = useEntityStore();
  const toast = useToastStore();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);

  // Local state for filtering and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Get all quotes
  const {
    data: quotesData,
    isLoading,
    refetch,
  } = api.quote.getAll.useQuery(
    {
      limit: pageSize,
      page: currentPage,
      search: searchQuery,
      status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
    },
    {
      enabled: status === 'authenticated' && mounted,
      refetchOnWindowFocus: true,
    }
  );

  // Safely extract quotes from the response
  const getQuotes = () => {
    if (!quotesData) return [];
    
    // Check if we have items property
    if ('items' in quotesData && Array.isArray(quotesData.items)) {
      return quotesData.items;
    }
    
    // Check if we have quotes property  
    if ('quotes' in quotesData && Array.isArray(quotesData.quotes)) {
      return quotesData.quotes;
    }
    
    // Return empty array if we can't find quotes
    return [];
  };
  
  // Get total count from response
  const getTotalQuotes = () => {
    if (!quotesData) return 0;
    
    // Check for total property
    if ('total' in quotesData) {
      return quotesData.total;
    }
    
    return getQuotes().length;
  };
  
  const quotes = getQuotes();
  const totalQuotes = getTotalQuotes();

  // Setup entity CRUD operations
  const utils = api.useContext();
  const deleteMutation = api.quote.delete.useMutation({
    onSuccess: () => {
      utils.quote.getAll.invalidate();
      toast.success('Quote deleted successfully');
      closeDeleteModal();
    },
    onError: (error) => {
      toast.error(`Error deleting quote: ${error.message}`);
    },
  });

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set global entity settings for the EntityList component
  useEffect(() => {
    entityStore.setEntitySettings({
      entityName: 'Quotes',
      entityType: 'quotes',
      baseUrl: '/admin/quotes',
      displayNameField: 'name',
      canView: true,
      canEdit: true,
      canDelete: true,
      listPath: '/admin/quotes',
      createPath: '/admin/quotes/new',
      editPath: '/admin/quotes/:id/edit',
      viewPath: '/admin/quotes/:id',
    });

    // Clean up
    return () => entityStore.resetEntitySettings();
  }, []);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle delete confirmation
  const handleDeleteQuote = async (quote: Quote) => {
    setQuoteToDelete(quote);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (quoteToDelete) {
      try {
        await deleteMutation.mutateAsync({ id: quoteToDelete.id });
      } catch (error) {
        // Error already handled by mutation
        console.error('Delete quote error:', error);
      }
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setQuoteToDelete(null);
  };

  // Get status color

  // Get status display name

  // Define columns for the quotes table
  const columns: EntityColumn<Quote>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (quote) => (
        <span className="font-mono text-xs">
          {formatUserFriendlyId(quote.id, quote.sequentialId)}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Quote',
      render: (quote) => (
        <div className="flex flex-col">
          <span className="font-medium">{quote.title}</span>
          <span className="text-muted-foreground text-xs">{formatDate(quote.createdAt)}</span>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (quote) => (
        <div className="flex flex-col">
          <span>{quote.customerName}</span>
          {quote.customerEmail && (
            <span className="text-muted-foreground text-xs">{quote.customerEmail}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (quote) => {
        const status = QuoteStatusSettings[quote.status];
        return (
          <Chip color={status.color} size="sm">
            {status.label}
          </Chip>
        );
      },
    },
    {
      key: 'total',
      label: 'Total',
      render: (quote) => <span className="font-medium">{formatCurrency(quote.grandTotal)}</span>,
    },
  ];

  // Render loading state
  if (!mounted || status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Quotes | Construction Quote Manager</title>
      </Head>

      <div className="p-6">
        <EntityList<Quote>
          title="Quotes"
          entities={quotes}
          columns={columns}
          baseUrl="/admin/quotes"
          isLoading={isLoading}
          enableSearch={true}
          searchPlaceholder="Search quotes..."
          onSearchChange={handleSearch}
          pagination={
            quotesData
              ? {
                  page: currentPage,
                  pageSize: pageSize,
                  total: totalQuotes,
                  onPageChange: setCurrentPage,
                }
              : undefined
          }
          actions={{
            view: true,
            edit: true,
            delete: true,
          }}
          onDelete={handleDeleteQuote}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={closeDeleteModal} backdrop="blur">
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalBody>
            {quoteToDelete && (
              <p>
                Are you sure you want to delete the quote &quot;{quoteToDelete.title}&quot;? This
                action cannot be undone.
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onPress={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="danger" onPress={confirmDelete} isLoading={deleteMutation.isPending}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
}
