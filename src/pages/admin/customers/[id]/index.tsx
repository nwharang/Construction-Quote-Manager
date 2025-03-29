import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Edit, Mail, Phone, MapPin, FileText, Plus } from 'lucide-react';
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
} from '@heroui/react';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { QuoteStatus } from '~/server/db/schema';

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

  // Fetch customer data
  const { data: customer, isLoading: isLoadingCustomer } = api.customer.getById.useQuery(
    { id: id as string },
    { enabled: !!id && authStatus === 'authenticated' }
  );

  // Fetch customer's quotes
  const { data: quotes, isLoading: isLoadingQuotes } = api.quote.getAll.useQuery(
    {
      customerId: id as string,
      limit: 10,
    },
    { enabled: !!id && authStatus === 'authenticated' }
  );

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
          <p className="text-muted-foreground">The customer you're looking for doesn't exist.</p>
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
        <title>Customer Details | Construction Quote Manager</title>
      </Head>

      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              variant="light"
              onPress={() => router.back()}
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
              <p className="text-muted-foreground">Customer details and quotes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-foreground">Contact Information</h2>
                <Button
                  isIconOnly
                  variant="light"
                  onPress={() => router.push(`/admin/customers/${customer.id}/edit`)}
                  aria-label="Edit customer"
                >
                  <Edit size={20} />
                </Button>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col gap-4">
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <a
                        href={`mailto:${customer.email}`}
                        className="text-primary hover:underline"
                      >
                        {customer.email}
                      </a>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <a
                        href={`tel:${customer.phone}`}
                        className="text-primary hover:underline"
                      >
                        {customer.phone}
                      </a>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <span className="text-foreground">{customer.address}</span>
                    </div>
                  )}
                  {customer.notes && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                      <span className="text-foreground">{customer.notes}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-foreground">Recent Quotes</h2>
                <Button
                  color="primary"
                  startContent={<Plus size={20} />}
                  onPress={() => router.push(`/admin/quotes/new?customerId=${customer.id}`)}
                >
                  New Quote
                </Button>
              </CardHeader>
              <CardBody>
                {isLoadingQuotes ? (
                  <div className="flex justify-center items-center h-32">
                    <Spinner />
                  </div>
                ) : quotes?.quotes.length === 0 ? (
                  <p className="text-muted-foreground text-center">No quotes found</p>
                ) : (
                  <Table aria-label="Recent quotes">
                    <TableHeader>
                      <TableColumn>DATE</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>TOTAL</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {quotes?.quotes.map((quote) => (
                        <TableRow
                          key={quote.id}
                          className="cursor-pointer"
                          onPress={() => router.push(`/admin/quotes/${quote.id}`)}
                        >
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
} 