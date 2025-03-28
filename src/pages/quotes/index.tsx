import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Plus, Edit, Eye, Trash2, Filter, Search, ArrowUpDown } from 'lucide-react';
import {
  Spinner,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
} from '@heroui/react';
import { api } from '../../trpc/react';
import { toast } from 'sonner';

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  let bgColor = '';
  let textColor = '';

  switch (status) {
    case 'DRAFT':
      bgColor = 'bg-gray-200';
      textColor = 'text-gray-800';
      break;
    case 'SENT':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
    case 'ACCEPTED':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case 'REJECTED':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    default:
      bgColor = 'bg-gray-200';
      textColor = 'text-gray-800';
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {status}
    </span>
  );
};

export default function QuotesPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Fetch quotes using tRPC and React Query
  const {
    data: quotes,
    isLoading,
    isError,
    error,
    refetch,
  } = api.quote.getAll.useQuery(undefined, {
    // Only run the query if the user is authenticated
    enabled: authStatus === 'authenticated',
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  // Delete quote mutation
  const deleteQuoteMutation = api.quote.delete.useMutation({
    onSuccess: () => {
      toast.success('Quote deleted successfully');
      // Refetch the quotes after deletion
      refetch();
    },
    onError: (err) => {
      toast.error(`Error deleting quote: ${err.message}`);
    },
  });

  const handleDeleteQuote = (id: string) => {
    if (confirm('Are you sure you want to delete this quote?')) {
      deleteQuoteMutation.mutate({ id });
    }
  };

  // Loading state
  if (authStatus === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  // Not authenticated
  if (authStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error loading quotes</h1>
        <p className="text-gray-600">{error?.message || 'Something went wrong'}</p>
        <Button color="primary" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  // Filter quotes based on search query and status filter
  const filteredQuotes =
    quotes?.filter((quote) => {
      const matchesSearch =
        quote.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quote.customerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || quote.status === statusFilter;

      return matchesSearch && matchesStatus;
    }) || [];

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numValue);
  };

  return (
    <>
      <Head>
        <title>Quotes | Construction Quote Manager</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quotes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your construction quotes</p>
          </div>

          <Button
            onClick={() => router.push('/quotes/new')}
            color="primary"
            startContent={<Plus size={20} />}
            className="mt-4 md:mt-0"
          >
            New Quote
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                type="text"
                className="flex-grow"
                placeholder="Search quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search className="text-gray-400" />}
              />

              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                startContent={<Filter className="text-gray-400" />}
                className="w-full md:w-64"
              >
                <SelectItem key="ALL" value="ALL">
                  All Statuses
                </SelectItem>
                <SelectItem key="DRAFT" value="DRAFT">
                  Draft
                </SelectItem>
                <SelectItem key="SENT" value="SENT">
                  Sent
                </SelectItem>
                <SelectItem key="ACCEPTED" value="ACCEPTED">
                  Accepted
                </SelectItem>
                <SelectItem key="REJECTED" value="REJECTED">
                  Rejected
                </SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Quotes List */}
        {filteredQuotes.length === 0 ? (
          <Card>
            <CardBody className="py-10 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No quotes match your filters'
                  : 'No quotes found. Create your first quote!'}
              </p>
              <Button
                color="primary"
                className="mx-auto mt-4"
                onPress={() => router.push('/quotes/new')}
                startContent={<Plus size={20} />}
              >
                New Quote
              </Button>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Table for larger screens */}
            <div className="hidden md:block">
              <Table aria-label="Quotes table">
                <TableHeader>
                  <TableColumn>Quote</TableColumn>
                  <TableColumn>Customer</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn>Total</TableColumn>
                  <TableColumn>Date</TableColumn>
                  <TableColumn>Actions</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>{quote.title}</TableCell>
                      <TableCell>{quote.customerName}</TableCell>
                      <TableCell>
                        <StatusBadge status={quote.status} />
                      </TableCell>
                      <TableCell>{formatCurrency(quote.grandTotal)}</TableCell>
                      <TableCell>{formatDate(quote.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            isIconOnly
                            onPress={() => router.push(`/quotes/${quote.id}`)}
                            aria-label="View Quote"
                          >
                            <Eye size={18} />
                          </Button>
                          <Button
                            size="sm"
                            isIconOnly
                            onPress={() => router.push(`/quotes/${quote.id}/edit`)}
                            aria-label="Edit Quote"
                          >
                            <Edit size={18} />
                          </Button>
                          <Button
                            size="sm"
                            isIconOnly
                            color="danger"
                            onPress={() => handleDeleteQuote(quote.id)}
                            aria-label="Delete Quote"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Cards for mobile screens */}
            <div className="md:hidden space-y-4">
              {filteredQuotes.map((quote) => (
                <Card key={quote.id} className="overflow-hidden">
                  <CardBody>
                    <div className="flex flex-col space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-lg">{quote.title}</h3>
                        <StatusBadge status={quote.status} />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">{quote.customerName}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatDate(quote.createdAt)}
                        </span>
                        <span className="font-semibold">{formatCurrency(quote.grandTotal)}</span>
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button
                          size="sm"
                          isIconOnly
                          onPress={() => router.push(`/quotes/${quote.id}`)}
                          aria-label="View Quote"
                        >
                          <Eye size={18} />
                        </Button>
                        <Button
                          size="sm"
                          isIconOnly
                          onPress={() => router.push(`/quotes/${quote.id}/edit`)}
                          aria-label="Edit Quote"
                        >
                          <Edit size={18} />
                        </Button>
                        <Button
                          size="sm"
                          isIconOnly
                          color="danger"
                          onPress={() => handleDeleteQuote(quote.id)}
                          aria-label="Delete Quote"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
