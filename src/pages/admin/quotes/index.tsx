'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { NextPageWithLayout } from '~/types/next';
import {
  Spinner,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  useDisclosure,
  // Remove unused Card, CardBody
  // Card,
  // CardBody,
} from '@heroui/react';
import { api, type RouterOutputs } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { MainLayout } from '~/layouts/MainLayout';
import { Plus, Search, MoreVertical, Edit, Trash } from 'lucide-react';
import { QuoteDetailModal } from '~/components/quotes/QuoteDetailModal';
import { DeleteEntityDialog } from '~/components/shared/DeleteEntityDialog';
import type { QuoteStatusType } from '~/server/db/schema-exports';
import { useAppToast } from '~/components/providers/ToastProvider';
import { APP_NAME } from '~/config/constants';

// Use inferred type from the API output for the list items
type QuoteListItem = RouterOutputs['quote']['getAll']['items'][number];

// Map status to display settings
const QuoteStatusSettings: Record<
  QuoteStatusType,
  { color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'; label: string }
> = {
  DRAFT: { color: 'default', label: 'Draft' },
  SENT: { color: 'primary', label: 'Sent' },
  ACCEPTED: { color: 'success', label: 'Accepted' },
  REJECTED: { color: 'danger', label: 'Rejected' },
};

// Define table columns - Use inferred type for t
const getColumns = (t: ReturnType<typeof useTranslation>['t']) => [
  { key: 'sequentialId', label: t('quotes.list.id'), allowSort: false },
  { key: 'title', label: t('quotes.list.title'), allowSort: true },
  { key: 'customerName', label: t('quotes.list.customer'), allowSort: false },
  { key: 'status', label: t('quotes.list.status'), allowSort: true },
  { key: 'createdAt', label: t('quotes.list.created'), allowSort: true },
  { key: 'grandTotal', label: t('quotes.list.total'), allowSort: true },
  { key: 'actions', label: t('common.actions'), allowSort: false },
];

const QuotesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { t, formatDate, formatCurrency } = useTranslation();
  const toast = useAppToast();
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'ascending' | 'descending'>('descending');
  const [quoteToDelete, setQuoteToDelete] = useState<QuoteListItem | null>(null);
  const [quoteIdForDetail, setQuoteIdForDetail] = useState<string | null>(null);

  // Modal state management
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const utils = api.useUtils();

  // === START: Define Callbacks at Top Level ===

  // Handle sort change
  const handleSortChange = useCallback(
    ({
      column,
      direction,
    }: {
      column: React.Key | null;
      direction: 'ascending' | 'descending' | null;
    }) => {
      if (column && direction) {
        const columnKey = String(column);
        if (columnKey === sortColumn) {
          setSortDirection(direction);
        } else {
          setSortColumn(columnKey);
          setSortDirection(direction);
        }
        setPage(1);
      }
    },
    [sortColumn, setSortColumn, setSortDirection, setPage]
  );

  // Handle opening Detail modal for CREATION
  const handleCreateQuote = useCallback(() => {
    setQuoteIdForDetail(null); // Set ID to null for create mode
    onDetailOpen();
  }, [onDetailOpen]);

  // Handle opening Detail modal for EDITING
  const handleEdit = useCallback(
    (quote: QuoteListItem) => {
      setQuoteIdForDetail(quote.id); // Set the ID for edit mode
      onDetailOpen();
    },
    [onDetailOpen]
  );

  const handleDeleteRequest = useCallback(
    (quote: QuoteListItem) => {
      setQuoteToDelete(quote);
      onDeleteOpen();
    },
    [onDeleteOpen]
  );

  // Delete mutation (Needs to be defined before confirmDelete)
  const deleteMutation = api.quote.delete.useMutation({
    onSuccess: () => {
      toast.success(t('quotes.deleteSuccess'));
      void utils.quote.getAll.invalidate();
      onDeleteClose();
      setQuoteToDelete(null);
    },
    onError: (error) => {
      toast.error(t('quotes.deleteError', { message: error.message }));
      onDeleteClose();
    },
  });

  // Confirm Delete
  const confirmDelete = useCallback(async () => {
    if (quoteToDelete) {
      await deleteMutation.mutateAsync({ id: quoteToDelete.id });
    }
  }, [quoteToDelete, deleteMutation]);

  // Get quote data query (Needs to be defined before handleDetailClose)
  const { data: quotesData, isLoading } = api.quote.getAll.useQuery(
    {
      page,
      limit: rowsPerPage,
      search: searchQuery,
      status: statusFilter !== 'all' ? (statusFilter as QuoteListItem['status']) : undefined,
      sortBy: sortColumn,
      sortOrder: sortDirection === 'ascending' ? 'asc' : 'desc',
    },
    {
      enabled: sessionStatus === 'authenticated' && mounted,
    }
  );

  // Render Cell Content
  const renderCellContent = useCallback(
    (quote: QuoteListItem, columnKey: React.Key) => {
      const cellValue = quote[columnKey as keyof QuoteListItem];

      switch (columnKey) {
        case 'customerName':
          return quote.customer?.name ?? 'N/A';
        case 'status': {
          const statusInfo = QuoteStatusSettings[quote.status];
          return (
            <Chip
              color={statusInfo?.color ?? 'default'}
              variant="flat"
              size="sm"
              className="capitalize"
            >
              {statusInfo?.label ?? quote.status}
            </Chip>
          );
        }
        case 'createdAt':
          return formatDate(quote.createdAt, 'short');
        case 'grandTotal':
          return formatCurrency(quote.grandTotal);
        case 'actions':
          return (
            <div className="relative flex items-center justify-end gap-1">
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="light" size="sm">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Quote Actions">
                  <DropdownItem
                    key="edit"
                    startContent={<Edit size={16} />}
                    onPress={() => handleEdit(quote)}
                  >
                    {t('common.edit')}
                  </DropdownItem>
                  <DropdownItem
                    key="print"
                    onPress={() => window.open(`/admin/quotes/${quote.id}/print`, '_blank')}
                  >
                    {t('quotes.actions.print')}
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    startContent={<Trash size={16} />}
                    className="text-danger"
                    color="danger"
                    onPress={() => handleDeleteRequest(quote)}
                  >
                    {t('common.delete')}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return cellValue?.toString() ?? '-';
      }
    },
    [t, formatDate, formatCurrency, handleEdit, handleDeleteRequest]
  );

  // Memoize the renderCell function - Add renderCellContent dependency
  const renderCell = useCallback(renderCellContent, [
    t,
    formatDate,
    formatCurrency,
    handleEdit,
    handleDeleteRequest,
    renderCellContent, // Add missing dependency
  ]);

  // === END: Define Callbacks at Top Level ===

  // Define columns using t
  const columns = useMemo(() => getColumns(t), [t]);

  // Safely extract quotes using useMemo for stability
  const quotes = useMemo(() => {
    return (quotesData?.items ?? []) as QuoteListItem[];
  }, [quotesData]);

  const totalPages = useMemo(() => {
    return quotesData?.totalPages ?? 1;
  }, [quotesData?.totalPages]);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // *** Early Returns ***
  if (!mounted || sessionStatus === 'loading') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    router.push('/api/auth/signin');
    return null;
  }
  // *** End Early Returns ***

  // JSX Return - Keep the rest of the component structure
  return (
    <>
      <Head>
        <title>
          {t('quotes.list.title')} | {APP_NAME}
        </title>
      </Head>

      {/* Main content area */}
      <div className="space-y-4 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        {/* Header and Actions */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-xl font-semibold">{t('quotes.list.header')}</h1>
          <Button color="primary" startContent={<Plus size={16} />} onPress={handleCreateQuote}>
            {t('quotes.createButton')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder={t('common.search')}
            startContent={<Search size={16} />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
          {/* TODO: Add Status Filter Select component here if needed */}
        </div>

        {/* Table */}
        <Table
          aria-label="Quotes Table"
          isHeaderSticky
          bottomContent={
            totalPages > 1 ? (
              <div className="flex w-full justify-center">
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="primary"
                  page={page}
                  total={totalPages}
                  onChange={setPage}
                />
              </div>
            ) : null
          }
          classNames={{
            wrapper: 'max-h-[calc(100vh-350px)]',
            table: 'min-h-[200px]',
          }}
          sortDescriptor={{
            column: sortColumn,
            direction: sortDirection,
          }}
          onSortChange={handleSortChange}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.key}
                align={column.key === 'actions' ? 'end' : 'start'}
                allowsSorting={column.allowSort}
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={quotes ?? []}
            isLoading={isLoading}
            loadingContent={<Spinner label="Loading quotes..." />}
            emptyContent={t('quotes.list.noQuotesFound')}
          >
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Unified Detail Modal (handles create/edit) */}
      {isDetailOpen && (
        <QuoteDetailModal
          isOpen={isDetailOpen}
          onClose={onDetailClose}
          quoteId={quoteIdForDetail} // Pass null for create, ID for edit
        />
      )}

      {/* Delete Dialog */}
      {isDeleteOpen && quoteToDelete && (
        <DeleteEntityDialog
          isOpen={isDeleteOpen}
          onClose={onDeleteClose}
          onConfirm={confirmDelete}
          isLoading={deleteMutation.isPending}
          entityName={t('quotes.entityName')}
          entityLabel={quoteToDelete.title}
        />
      )}
    </>
  );
};

QuotesPage.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default QuotesPage;
