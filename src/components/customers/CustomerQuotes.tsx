'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Chip,
} from '@heroui/react';
import { ExternalLink, FileText } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';
import { api } from '~/utils/api';
import { getStatusColor } from '~/utils/statusColors';
import { routes } from '~/config/routes';
import type { QuoteStatusType } from '~/server/db/schema';
import type { RouterOutputs } from '~/utils/api';

// Use the actual type from the API response
type QuoteItem = RouterOutputs['quote']['getAll']['items'][number];

interface CustomerQuotesProps {
  customerId: string;
}

export const CustomerQuotes: React.FC<CustomerQuotesProps> = ({ customerId }) => {
  const router = useRouter();
  const { t, formatDate, formatCurrency } = useTranslation();

  // Fetch quotes for the customer
  const { data: quotesData, isLoading } = api.quote.getAll.useQuery(
    {
      customerId,
      limit: 10,
      page: 1
    },
    {
      enabled: !!customerId,
      refetchOnWindowFocus: false,
    }
  );

  // Navigate to the quote detail page
  const navigateToQuote = (quoteId: string) => {
    router.push(routes.admin.quotes.detail(quoteId));
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Related Quotes</h3>
        <Button
          color="primary"
          variant="light"
          startContent={<FileText size={16} />}
          onPress={() => router.push(`${routes.admin.quotes.new}?customerId=${customerId}`)}
        >
          Create Quote
        </Button>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Spinner />
          </div>
        ) : quotesData?.items && quotesData.items.length > 0 ? (
          <Table aria-label="Customer quotes">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>Title</TableColumn>
              <TableColumn>Date</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Total</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody>
              {quotesData.items.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>#{quote.sequentialId}</TableCell>
                  <TableCell>{quote.title}</TableCell>
                  <TableCell>{formatDate(quote.createdAt)}</TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(quote.status)}
                      size="sm"
                      variant="flat"
                    >
                      {quote.status}
                    </Chip>
                  </TableCell>
                  <TableCell>{formatCurrency(quote.grandTotal)}</TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => navigateToQuote(quote.id)}
                      aria-label="View quote"
                    >
                      <ExternalLink size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center">
            <p className="mb-4 text-gray-500">No quotes found for this customer</p>
            <Button
              color="primary"
              startContent={<FileText size={16} />}
              onPress={() => router.push(`${routes.admin.quotes.new}?customerId=${customerId}`)}
            >
              Create First Quote
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}; 