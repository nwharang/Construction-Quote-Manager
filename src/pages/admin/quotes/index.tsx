import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Plus, Search, MoreVertical } from 'lucide-react';
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
} from '@heroui/react';
import { api } from '~/utils/api';
import { toast } from 'sonner';
import { QuoteStatus } from '~/server/db/schema';
import type { RouterOutputs } from '~/utils/api';

type Quote = RouterOutputs['quote']['getAll']['items'][number];
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

export default function QuotesPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [filterValue, setFilterValue] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<QuoteStatusType>>(new Set());
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch quotes with pagination
  const quotesQuery = api.quote.getAll.useQuery(
    {
      page,
      limit: rowsPerPage,
      search: filterValue,
      statuses: selectedStatuses.size > 0 ? Array.from(selectedStatuses) : undefined,
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

  // Format currency
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(value));
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

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
        return formatCurrency(quote.grandTotal);
      case 'date':
        return formatDate(quote.createdAt);
      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="light">
                <MoreVertical size={20} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem key="view" onPress={() => router.push(`/admin/quotes/${quote.id}`)}>
                View
              </DropdownItem>
              <DropdownItem
                key="edit"
                onPress={() => router.push(`/admin/quotes/${quote.id}/edit`)}
              >
                Edit
              </DropdownItem>
              <DropdownItem
                key="delete"
                className="text-danger"
                onPress={() => handleDeleteQuote(quote.id)}
              >
                Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
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
            <Dropdown>
              <DropdownTrigger>
                <Button variant="flat">
                  Status {selectedStatuses.size > 0 && `(${selectedStatuses.size})`}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Status filter"
                closeOnSelect={false}
                selectedKeys={selectedStatuses}
                selectionMode="multiple"
                onSelectionChange={(keys) => {
                  if (keys instanceof Set) {
                    setSelectedStatuses(new Set(Array.from(keys) as QuoteStatusType[]));
                    setPage(1);
                  }
                }}
              >
                {Object.values(QuoteStatus).map((status) => (
                  <DropdownItem key={status} className="capitalize">
                    {status.toLowerCase()}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>

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
              items={quotesQuery.data?.items ?? []}
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

          {quotesQuery.data && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <select
                    className="text-sm border rounded-md px-2 py-1 bg-background text-foreground"
                    value={rowsPerPage}
                    onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                  >
                    {[10, 20, 30, 40, 50].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {quotesQuery.data.total} items
                  </span>
                </div>
              </div>
              <div className="flex justify-center">
                <Pagination
                  total={quotesQuery.data.totalPages}
                  page={page}
                  onChange={handlePageChange}
                  showControls
                  color="primary"
                  classNames={{
                    wrapper: 'gap-2',
                    item: 'w-8 h-8',
                    cursor: 'bg-primary',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
