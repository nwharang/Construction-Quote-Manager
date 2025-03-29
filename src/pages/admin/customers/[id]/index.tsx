import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Edit, Mail, Phone, MapPin, FileText, Plus, CalendarDays, Search } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Divider,
  Link,
  Pagination,
  Tabs,
  Tab,
  Input,
} from '@heroui/react';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { type QuoteStatus } from '~/server/db/schema';
import { useAppToast } from '~/components/providers/ToastProvider';

// Fix: Use import type for type-only imports
import type { customers } from '~/server/db/schema';
import type { RouterOutputs } from '~/utils/api';

type Quote = RouterOutputs['quote']['getAll']['quotes'][number];

const statusColorMap: Record<keyof typeof QuoteStatus, 'default' | 'primary' | 'success' | 'danger'> = {
  DRAFT: 'default',
  SENT: 'primary',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

export default function CustomerDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: authStatus } = useSession();
  const { formatDate, formatCurrency } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch customer data
  const { data: customer, isLoading: isLoadingCustomer } = api.customer.getById.useQuery(
    { id: id as string },
    { enabled: !!id && authStatus === 'authenticated' }
  );

  // Fetch customer's quotes with pagination
  const { data: quotesData, isLoading: isLoadingQuotes } = api.quote.getAll.useQuery(
    {
      search: id as string,
      page,
      limit: rowsPerPage,
    },
    { enabled: !!id && authStatus === 'authenticated' }
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  // Not authenticated
  if (authStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Loading customer data
  if (isLoadingCustomer) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  // Customer not found
  if (!customer) {
    return (
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-2xl font-bold text-foreground mb-2">Customer Not Found</h1>
          <p className="text-muted-foreground">The customer you&apos;re looking for doesn&apos;t exist.</p>
          <Button
            color="primary"
            className="mt-4"
            onPress={() => router.push('/admin/customers')}
          >
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{customer.name} | Customer Details</title>
      </Head>

      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-4">
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
                <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
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
          <div className="bg-background/50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-foreground mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customer.email && (
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${customer.email}`}
                      className="text-primary hover:underline"
                    >
                      {customer.email}
                    </a>
                  </div>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a
                      href={`tel:${customer.phone}`}
                      className="text-primary hover:underline"
                    >
                      {customer.phone}
                    </a>
                  </div>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <span className="text-foreground">{customer.address}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer Since</p>
                  <span className="text-foreground">{formatDate(customer.createdAt)}</span>
                </div>
              </div>
            </div>

            {customer.notes && (
              <div className="mt-6">
                <h3 className="text-md font-medium text-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Notes
                </h3>
                <p className="text-foreground bg-background/80 p-4 rounded-md">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Customer History Section */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-foreground">Quote History</h2>
              <div className="flex gap-2">
                <Input
                  isClearable
                  placeholder="Search quotes..."
                  startContent={<Search size={16} />}
                  size="sm"
                  value={searchQuery}
                  onValueChange={handleSearch}
                  className="w-64"
                />
              </div>
            </div>

            {isLoadingQuotes ? (
              <div className="flex justify-center items-center h-48">
                <Spinner />
              </div>
            ) : !quotesData || quotesData.quotes.length === 0 ? (
              <div className="text-center py-12 bg-background/50 rounded-lg">
                <p className="text-muted-foreground">No quotes found for this customer</p>
                <Button
                  color="primary"
                  className="mt-4"
                  startContent={<Plus size={16} />}
                  onPress={() => router.push(`/admin/quotes/new?customerId=${customer.id}`)}
                >
                  Create First Quote
                </Button>
              </div>
            ) : (
              <div className="bg-background/50 rounded-lg overflow-hidden">
                <Table aria-label="Customer quotes history">
                  <TableHeader>
                    <TableColumn>QUOTE #</TableColumn>
                    <TableColumn>TITLE</TableColumn>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>TOTAL</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {quotesData.quotes.map((quote, index) => {
                      // Calculate quote number based on pagination
                      const quoteNumber = (page - 1) * rowsPerPage + index + 1;
                      
                      return (
                        <TableRow key={quote.id}>
                          <TableCell>#{quote.sequentialId}</TableCell>
                          <TableCell>{quote.title}</TableCell>
                          <TableCell>{formatDate(quote.createdAt)}</TableCell>
                          <TableCell>
                            <Chip
                              className="capitalize"
                              color={statusColorMap[quote.status]}
                              size="sm"
                              variant="flat"
                            >
                              {quote.status.toLowerCase()}
                            </Chip>
                          </TableCell>
                          <TableCell>{formatCurrency(Number(quote.grandTotal))}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              onPress={() => router.push(`/admin/quotes/${quote.id}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {quotesData.total > rowsPerPage && (
                  <div className="flex justify-center p-4">
                    <Pagination
                      total={Math.ceil(quotesData.total / rowsPerPage)}
                      page={page}
                      onChange={handlePageChange}
                      showControls
                      color="primary"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background/50 p-6 rounded-lg">
              <h3 className="text-md font-medium text-foreground mb-2">Total Quotes</h3>
              <p className="text-2xl font-bold">{quotesData?.total || 0}</p>
            </div>
            <div className="bg-background/50 p-6 rounded-lg">
              <h3 className="text-md font-medium text-foreground mb-2">Accepted Quotes</h3>
              <p className="text-2xl font-bold text-success">
                {quotesData?.quotes.filter(q => q.status === 'ACCEPTED').length || 0}
              </p>
            </div>
            <div className="bg-background/50 p-6 rounded-lg">
              <h3 className="text-md font-medium text-foreground mb-2">Revenue</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  quotesData?.quotes
                    .filter(q => q.status === 'ACCEPTED')
                    .reduce((sum, quote) => sum + Number(quote.grandTotal), 0) || 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 