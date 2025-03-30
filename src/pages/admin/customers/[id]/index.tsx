import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Mail, Phone, MapPin, FileText, Plus, CalendarDays } from 'lucide-react';
import { Button, Spinner, Chip, Badge } from '@heroui/react';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { type QuoteStatus } from '~/server/db/schema';
import { useAppToast } from '~/components/providers/ToastProvider';
import { Layout } from '~/components/Layout';
import { EntityList, type EntityColumn } from '~/components/shared/EntityList';

// Fix: Use import type for type-only imports
import type { customers } from '~/server/db/schema';
import type { RouterOutputs } from '~/utils/api';

type Quote = RouterOutputs['quote']['getAll']['quotes'][number];

const statusColorMap: Record<
  keyof typeof QuoteStatus,
  'default' | 'primary' | 'success' | 'danger'
> = {
  DRAFT: 'default',
  SENT: 'primary',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

export default function CustomerDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { status: authStatus } = useSession();
  const { formatDate, formatCurrency } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useAppToast();

  // Fetch customer data
  const { data: customer, isLoading: isLoadingCustomer } = api.customer.getById.useQuery(
    { id: id as string },
    { enabled: !!id && authStatus === 'authenticated' }
  );

  // Fetch customer's quotes with pagination
  const {
    data: quotesData,
    isLoading: isLoadingQuotes,
    refetch: refetchQuotes,
  } = api.quote.getAll.useQuery(
    {
      search: customer?.name || (id as string),
      page,
      limit: rowsPerPage,
    },
    { enabled: !!id && authStatus === 'authenticated' }
  );

  // Define quote columns
  const quoteColumns: EntityColumn<Quote>[] = [
    {
      key: 'title',
      label: 'Quote Title',
      render: (quote) => (
        <div className="flex flex-col">
          <span className="font-medium">{quote.title}</span>
          <span className="text-muted-foreground text-xs">#{quote.id.substring(0, 8)}...</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (quote) => (
        <Badge color={statusColorMap[quote.status as keyof typeof statusColorMap]}>
          {quote.status}
        </Badge>
      ),
    },
    {
      key: 'grandTotal',
      label: 'Amount',
      render: (quote) => formatCurrency(quote.grandTotal),
    },
    {
      key: 'createdAt',
      label: 'Created On',
      render: (quote) => formatDate(quote.createdAt),
    },
  ];

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  // Handle quote deletion
  const deleteQuoteMutation = api.quote.delete.useMutation({
    onSuccess: () => {
      toast.success('Quote deleted successfully');
      void refetchQuotes();
    },
    onError: (error) => {
      toast.error(`Failed to delete quote: ${error.message}`);
    },
  });

  const handleDeleteQuote = (quote: Quote) => {
    if (confirm(`Are you sure you want to delete quote: ${quote.title}?`)) {
      deleteQuoteMutation.mutate({ id: quote.id });
    }
  };

  // Safely get quotes from the response
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
    return [];
  };

  const quotes = getQuotes();
  const totalQuotes = quotesData?.total || 0;

  // Not authenticated
  if (authStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Loading customer data
  if (isLoadingCustomer) {
    return (
      <Layout>
        <div className="flex h-96 items-center justify-center">
          <Spinner size="lg" color="primary" />
        </div>
      </Layout>
    );
  }

  // Customer not found
  if (!customer) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex h-64 flex-col items-center justify-center">
            <h1 className="text-foreground mb-2 text-2xl font-bold">Customer Not Found</h1>
            <p className="text-muted-foreground">
              The customer you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button
              color="primary"
              className="mt-4"
              onPress={() => router.push('/admin/customers')}
            >
              Back to Customers
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{customer.name} | Customer Details</title>
      </Head>

      <div className="p-6">
        <div className="flex flex-col gap-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                variant="light"
                onPress={() => router.back()}
                isDisabled={isLoadingCustomer}
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-foreground text-2xl font-bold">{customer.name}</h1>
                <p className="text-muted-foreground">Customer&apos;s details and history</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                color="primary"
                variant="bordered"
                onPress={() => router.push(`/admin/customers/${customer.id}/edit`)}
              >
                Edit
              </Button>
              <Button
                color="primary"
                startContent={<Plus size={18} />}
                onPress={() => router.push(`/admin/quotes/new?customerId=${customer.id}`)}
              >
                New Quote
              </Button>
            </div>
          </div>

          {/* Customer Information Panel */}
          <div className="bg-background/50 rounded-lg p-6">
            <h2 className="text-foreground mb-4 text-lg font-semibold">Contact Information</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {customer.email && (
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <Mail className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Email</p>
                    <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                      {customer.email}
                    </a>
                  </div>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <Phone className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Phone</p>
                    <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <MapPin className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Address</p>
                    <span className="text-foreground">{customer.address}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-full p-2">
                  <CalendarDays className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Customer Since</p>
                  <span className="text-foreground">{formatDate(customer.createdAt)}</span>
                </div>
              </div>
            </div>

            {customer.notes && (
              <div className="mt-6">
                <h3 className="text-md text-foreground mb-2 flex items-center gap-2 font-medium">
                  <FileText className="text-muted-foreground h-4 w-4" />
                  Notes
                </h3>
                <p className="text-foreground bg-background/80 rounded-md p-4">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Customer's Quotes Section using EntityList */}
          <div className="mt-4">
            <EntityList<Quote>
              title="Quote History"
              entities={quotes}
              columns={quoteColumns}
              baseUrl="/admin/quotes"
              isLoading={isLoadingQuotes}
              enableSearch={true}
              searchPlaceholder="Search quotes..."
              onSearchChange={handleSearch}
              emptyStateMessage="No quotes found for this customer"
              emptyStateAction={{
                label: 'Create Quote',
                onClick: () => router.push(`/admin/quotes/new?customerId=${customer.id}`),
                icon: <Plus size={16} />,
              }}
              pagination={
                quotesData
                  ? {
                      page,
                      pageSize: rowsPerPage,
                      total: totalQuotes,
                      onPageChange: setPage,
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
        </div>
      </div>
    </Layout>
  );
}
