import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Plus, Search, MoreVertical, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Spinner,
  Select,
  SelectItem,
  Card,
  CardBody,
} from '@heroui/react';
import { api } from '~/utils/api';
import { useAppToast } from '~/components/providers/ToastProvider';
import { QuoteStatus } from '~/server/db/schema';
import type { RouterOutputs } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { TRPCClientError } from '@trpc/client';
import type { AppRouter } from '~/server/api/root';

type Quote = RouterOutputs['quote']['getAll']['quotes'][number];
type QuoteStatusType = (typeof QuoteStatus)[keyof typeof QuoteStatus];

interface Column {
  name: string;
  uid: string;
}

const statusColorMap: Record<QuoteStatusType, 'default' | 'primary' | 'success' | 'danger'> = {
  [QuoteStatus.DRAFT]: 'default',
  [QuoteStatus.SENT]: 'primary',
  [QuoteStatus.ACCEPTED]: 'success',
  [QuoteStatus.REJECTED]: 'danger',
};

const columns: Column[] = [
  { name: 'TITLE', uid: 'title' },
  { name: 'CUSTOMER', uid: 'customer' },
  { name: 'STATUS', uid: 'status' },
  { name: 'TOTAL', uid: 'total' },
  { name: 'DATE', uid: 'date' },
  { name: 'ACTIONS', uid: 'actions' },
];

const QuoteLoadingError = ({ 
  error, 
  onRetry 
}: { 
  error: unknown; 
  onRetry: () => void;
}) => {
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
      ? error 
      : 'Failed to load quotes';
      
  const isNetworkError = errorMessage.includes('Failed to fetch') || 
                         errorMessage.includes('network');
  
  return (
    <Card className="w-full bg-danger-50">
      <CardBody>
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <AlertTriangle size={48} className="text-danger" />
          <h2 className="text-xl font-semibold">Error Loading Quotes</h2>
          <p className="text-gray-600">
            {isNetworkError 
              ? 'Network error. Please check your internet connection.' 
              : errorMessage}
          </p>
          <Button 
            color="primary" 
            startContent={<RefreshCw className="h-4 w-4" />}
            onClick={onRetry}
          >
            Retry
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default function QuotesPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [filterValue, setFilterValue] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatusType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const toast = useAppToast();
  const { formatDate, formatCurrency } = useTranslation();

  // Fetch quotes with pagination
  const quotesQuery = api.quote.getAll.useQuery(
    {
      page,
      limit: rowsPerPage,
      search: filterValue,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
    },
    { enabled: authStatus === 'authenticated' }
  );

  // Delete quote mutation
  const deleteQuoteMutation = api.quote.delete.useMutation({
    onSuccess: () => {
      toast.success('Quote deleted successfully');
      // Refetch the quotes after deletion
      void quotesQuery.refetch();
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(1);
  };

  // Not authenticated
  if (authStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const renderCell = (quote: Quote, columnKey: string) => {
    switch (columnKey) {
      case 'title':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize text-foreground">{quote.title}</p>
            <p className="text-bold text-tiny capitalize text-muted-foreground">#{quote.id}</p>
          </div>
        );
      case 'customer':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize text-foreground">{quote.customerName}</p>
            {quote.customerEmail && (
              <p className="text-bold text-tiny capitalize text-muted-foreground">
                {quote.customerEmail}
              </p>
            )}
          </div>
        );
      case 'status':
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[quote.status]}
            size="sm"
            variant="flat"
          >
            {quote.status.toLowerCase()}
          </Chip>
        );
      case 'total':
        return formatCurrency(Number(quote.grandTotal));
      case 'date':
        return formatDate(quote.createdAt);
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="flat"
              color="primary"
              onPress={() => router.push(`/admin/quotes/${quote.id}`)}
              isDisabled={deleteQuoteMutation.isPending}
            >
              View
            </Button>
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light" isDisabled={deleteQuoteMutation.isPending}>
                  <MoreVertical className="text-default-500" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Quote actions">
                <DropdownItem
                  key="edit"
                  onPress={() => router.push(`/admin/quotes/${quote.id}/edit`)}
                >
                  Edit
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  onPress={() => handleDeleteQuote(quote.id)}
                  isDisabled={deleteQuoteMutation.isPending}
                >
                  {deleteQuoteMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    'Delete'
                  )}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Quotes | Construction Quote Manager</title>
      </Head>

      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Quotes</h1>
              <p className="text-muted-foreground">Manage your construction quotes</p>
            </div>
            <Button
              color="primary"
              startContent={<Plus size={20} />}
              onPress={() => router.push('/admin/quotes/new')}
            >
              New Quote
            </Button>
          </div>

          <div className="flex justify-between items-center gap-3">
            <Input
              isClearable
              className="w-full sm:max-w-[44%]"
              placeholder="Search by title or customer..."
              startContent={<Search size={18} />}
              value={filterValue}
              onValueChange={(value) => {
                setFilterValue(value);
                setPage(1);
              }}
            />
            <Select
              className="w-full sm:max-w-[44%]"
              placeholder="Filter by status"
              selectedKeys={[selectedStatus]}
              onChange={(e) => {
                setSelectedStatus(e.target.value as QuoteStatusType | 'all');
                setPage(1);
              }}
            >
              <SelectItem key="all" textValue="All Statuses">
                All Statuses
              </SelectItem>
              <SelectItem key={QuoteStatus.DRAFT} textValue="Draft">
                Draft
              </SelectItem>
              <SelectItem key={QuoteStatus.SENT} textValue="Sent">
                Sent
              </SelectItem>
              <SelectItem key={QuoteStatus.ACCEPTED} textValue="Accepted">
                Accepted
              </SelectItem>
              <SelectItem key={QuoteStatus.REJECTED} textValue="Rejected">
                Rejected
              </SelectItem>
            </Select>
          </div>

          {quotesQuery.isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
            </div>
          ) : quotesQuery.isError ? (
            <QuoteLoadingError error={quotesQuery.error} onRetry={() => void quotesQuery.refetch()} />
          ) : (
            <>
              <Table
                aria-label="Quotes table"
                isHeaderSticky
                classNames={{
                  wrapper: 'max-h-[600px]',
                  th: 'bg-background/50 backdrop-blur-lg text-foreground',
                  td: 'text-foreground',
                }}
              >
                <TableHeader columns={columns}>
                  {(column) => (
                    <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                      {column.name}
                    </TableColumn>
                  )}
                </TableHeader>
                <TableBody
                  items={quotesQuery.data?.quotes ?? []}
                  emptyContent="No quotes found"
                  isLoading={quotesQuery.isLoading}
                  loadingContent={<Spinner />}
                >
                  {(quote) => (
                    <TableRow key={quote.id}>
                      {(columnKey) => <TableCell>{renderCell(quote, String(columnKey))}</TableCell>}
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center">
                <Pagination
                  total={Math.ceil((quotesQuery.data?.total ?? 0) / rowsPerPage)}
                  page={page}
                  onChange={handlePageChange}
                  showControls
                />
                <Select
                  className="w-32"
                  selectedKeys={[rowsPerPage.toString()]}
                  onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                >
                  <SelectItem key="10" textValue="10 per page">
                    10 per page
                  </SelectItem>
                  <SelectItem key="20" textValue="20 per page">
                    20 per page
                  </SelectItem>
                  <SelectItem key="50" textValue="50 per page">
                    50 per page
                  </SelectItem>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
