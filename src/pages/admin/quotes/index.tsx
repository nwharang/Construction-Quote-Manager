'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Select,
  SelectItem,
  useDisclosure,
  Card,
  CardBody,
} from '@heroui/react';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { useEntityStore, useToastStore } from '~/store';
import MainLayout from '~/layouts/MainLayout';
import { Plus, Search, MoreVertical, Edit, Eye, Send } from 'lucide-react';
import type { inferRouterOutputs, inferRouterInputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';
import { CreateQuoteModal } from '~/components/quotes/CreateQuoteModal';
import { QuoteDetailModal } from '~/components/quotes/QuoteDetailModal';
import { QuoteViewModal } from '~/components/quotes/QuoteViewModal';
import { formatCurrency } from '~/utils/currency';
import { formatDate, formatUserFriendlyId } from '~/utils/formatters';
import type { QuoteStatusType } from '~/server/db/schema-exports';

// Get the types from the router
type RouterOutput = inferRouterOutputs<AppRouter>;

// Get the type from the getAll procedure's return type
type QuoteListResponse = RouterOutput['quote']['getAll'];
// Correctly type QuoteItem based on the actual response shape (`items`)
type QuoteItem = NonNullable<QuoteListResponse['items']>[number];

// Map status to display settings
const QuoteStatusSettings: Record<
  QuoteStatusType,
  { color: 'default' | 'primary' | 'success' | 'danger'; label: string }
> = {
  DRAFT: { color: 'default', label: 'Draft' },
  SENT: { color: 'primary', label: 'Sent' },
  ACCEPTED: { color: 'success', label: 'Accepted' },
  REJECTED: { color: 'danger', label: 'Rejected' },
};

// Define table columns - Use t() for labels
const getColumns = (t: Function) => [
  { key: 'id', label: t('common.id'), allowSort: false },
  { key: 'title', label: t('quotes.quote'), allowSort: true },
  { key: 'customer', label: t('quotes.customer'), allowSort: false },
  { key: 'status', label: t('common.status'), allowSort: true },
  { key: 'total', label: t('common.total'), allowSort: true },
  { key: 'actions', label: t('common.actions'), allowSort: false },
];

const QuotesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  // Correct useTranslation destructuring if formatters aren't used
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const entityStore = useEntityStore();
  const toast = useToastStore();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'ascending' | 'descending'>('descending');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  // Modal state management
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

  // Define columns using t
  const columns = useMemo(() => getColumns(t), [t]);

  // Get all quotes
  const {
    data: quotesData,
    isLoading,
    refetch,
  } = api.quote.getAll.useQuery(
    {
      page,
      limit: rowsPerPage,
      search: searchQuery,
      status: statusFilter !== 'all' ? (statusFilter as QuoteItem['status']) : undefined,
    },
    {
      enabled: sessionStatus === 'authenticated' && mounted,
    }
  );

  // Safely extract quotes using useMemo for stability
  const quotes = useMemo(() => {
    return (quotesData?.items ?? []) as QuoteItem[];
  }, [quotesData]);

  // Get total count from response
  const totalQuotes = useMemo(() => {
    return quotesData?.total ?? 0;
  }, [quotesData]);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set global entity settings once when component mounts
  useEffect(() => {
    if (mounted) {
      entityStore.setEntitySettings({
        entityName: t('quotes.entityName', {}),
        entityType: 'quotes',
        baseUrl: '/admin/quotes',
        displayNameField: 'title',
        canView: true,
        canEdit: true,
        canDelete: false,
        listPath: '/admin/quotes',
        createPath: '#',
        editPath: '#',
        viewPath: '#',
      });
    }
  }, [mounted]); // Only depend on mounted state

  // Clean up entity settings when component unmounts
  useEffect(() => {
    return () => {
      if (mounted) {
        entityStore.resetEntitySettings();
      }
    };
  }, [mounted]); // Only depend on mounted state

  // Render loading state
  if (!mounted || sessionStatus === 'loading') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Handle sort change - Update signature to match Table prop
  const handleSortChange = ({
    column,
    direction,
  }: {
    column: React.Key | null;
    direction: 'ascending' | 'descending' | null;
  }) => {
    if (column && direction) {
      const columnKey = String(column); // Convert React.Key to string
      if (columnKey === sortColumn) {
        setSortDirection(direction);
      } else {
        setSortColumn(columnKey);
        setSortDirection(direction);
      }
      // Reset to first page when sorting changes
      setPage(1);
    }
  };

  // Open Create Modal
  const handleCreateQuote = () => {
    onCreateOpen();
  };

  // Open View Modal
  const handleViewQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    onViewOpen();
  };

  // Open Edit Modal
  const handleEditQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    onDetailOpen();
  };

  // Function to handle opening Detail modal after creation
  const handleCreateSuccess = (newQuoteId: string) => {
    onCreateClose(); // Close the create modal
    handleEditQuote(newQuoteId); // Open the detail/edit modal for the new quote
  };

  const handleSendQuote = async (quote: QuoteItem) => {
    try {
      // TODO: Implement quote sending logic
      toast.success('Quote sent successfully');
    } catch (error) {
      toast.error('Failed to send quote');
    }
  };

  // Render cell content for table - Use t() for status labels
  const renderCell = (quote: QuoteItem, columnKey: string) => {
    switch (columnKey) {
      case 'id':
        return <div>#{quote.sequentialId}</div>;
      case 'title':
        return (
          <div className="flex flex-col">
            <p className="text-foreground font-medium">{quote.title}</p>
            <p className="text-default-500 text-xs">{formatDate(quote.createdAt)}</p>
          </div>
        );
      case 'customer':
        if (quote.customer) {
          return (
            <div className="flex flex-col">
              <p className="font-medium">{quote.customer.name}</p>
              {quote.customer.email && (
                <p className="text-default-500 text-xs">{quote.customer.email}</p>
              )}
            </div>
          );
        }
        return <span className="text-default-500 text-sm">{t('common.notAvailable')}</span>;
      case 'status': {
        const statusKey = (quote.status ?? 'UNKNOWN').toUpperCase();
        const baseSetting = QuoteStatusSettings[statusKey as QuoteStatusType] || {
          color: 'default',
          label: 'Unknown',
        };
        // Add empty object {} as second argument
        const label = t(`quotes.status.${statusKey.toLowerCase()}`, {});
        return (
          <Chip color={baseSetting.color} size="sm">
            {label}
          </Chip>
        );
      }
      case 'total':
        return formatCurrency(Number(quote.grandTotal));
      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="light">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            {/* Add empty object {} */}
            <DropdownMenu aria-label={t('quotes.actionsLabel')}>
              <DropdownItem
                key="view"
                startContent={<Eye className="h-4 w-4" />}
                onClick={() => handleViewQuote(quote.id)}
              >
                {/* Add empty object {} */}
                {t('common.view')}
              </DropdownItem>
              <DropdownItem
                key="edit"
                startContent={<Edit className="h-4 w-4" />}
                onClick={() => handleEditQuote(quote.id)}
              >
                {/* Add empty object {} */}
                {t('common.edit')}
              </DropdownItem>
              <DropdownItem
                key="send"
                startContent={<Send size={16} />}
                onPress={() => handleSendQuote(quote)}
              >
                {/* Add empty object {} */}
                {t('quotes.sendAction')}
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
        {/* Add empty object {} */}
        <title>{t('quotes.pageTitle')}</title>
      </Head>
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        {/* Top Bar - Actions */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('quotes.listTitle')}</h1>
          <div className="flex gap-2">
            {/* Search Input */}
            <Input
              isClearable
              placeholder={t('common.searchPlaceholder')}
              startContent={<Search size={18} />}
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="w-full sm:max-w-[44%]"
            />
            {/* Status Filter */}
            <Select
              label={t('common.statusFilterLabel')}
              placeholder={t('common.allStatuses')}
              selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
              onSelectionChange={(keys) => {
                // Handle Set<React.Key> type for selectedKeys
                const selectedKey = Array.from(keys)[0];
                setStatusFilter(selectedKey ? String(selectedKey) : 'all');
                setPage(1); // Reset page when filter changes
              }}
              size="md"
              className="max-w-[150px]"
            >
              <SelectItem key="all">{t('common.allStatuses')}</SelectItem>
              <>
                {Object.entries(QuoteStatusSettings).map(([key, setting]) => (
                  <SelectItem key={key}>
                    {t(`quotes.status.${key.toLowerCase()}`, { defaultValue: setting.label })}
                  </SelectItem>
                ))}
              </>
            </Select>
            {/* Create Button */}
            <Button color="primary" startContent={<Plus size={18} />} onClick={handleCreateQuote}>
              {t('quotes.createButton')}
            </Button>
          </div>
        </div>

        {/* Loading state for table */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <Card>
            <CardBody>
              {/* Main Table */}
              <Table
                aria-label={t('quotes.listAriaLabel')}
                sortDescriptor={{
                  column: sortColumn,
                  direction: sortDirection,
                }}
                onSortChange={handleSortChange}
                bottomContent={
                  totalQuotes > 0 ? (
                    <div className="flex w-full justify-center">
                      <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={page}
                        total={Math.ceil(totalQuotes / rowsPerPage)}
                        onChange={(newPage) => setPage(newPage)}
                      />
                    </div>
                  ) : null
                }
              >
                <TableHeader columns={columns}>
                  {(column) => (
                    <TableColumn
                      key={column.key}
                      // Add conditional alignment for total column
                      className={column.key === 'total' ? 'text-right' : 'text-left'}
                      allowsSorting={column.allowSort}
                    >
                      {column.label}
                    </TableColumn>
                  )}
                </TableHeader>
                <TableBody items={quotes} emptyContent={t('quotes.noQuotesFound')}>
                  {(item) => (
                    <TableRow key={item.id}>
                      {(columnKey) => (
                        <TableCell className={columnKey === 'total' ? 'text-right' : 'text-left'}>
                          {renderCell(item, String(columnKey))}
                        </TableCell>
                      )}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        )}

        {/* Create Modal */}
        <CreateQuoteModal
          isOpen={isCreateOpen}
          onClose={onCreateClose}
          onSuccess={handleCreateSuccess} // Pass the success handler
        />

        {/* Detail/Edit Modal */}
        <QuoteDetailModal
          quoteId={selectedQuoteId}
          isOpen={isDetailOpen}
          onClose={() => {
            setSelectedQuoteId(null);
            onDetailClose();
          }}
          onSaveSuccess={() => refetch()} // Refetch list after saving changes
        />

        {/* View Modal */}
        <QuoteViewModal
          quoteId={selectedQuoteId}
          isOpen={isViewOpen}
          onClose={() => {
            setSelectedQuoteId(null);
            onViewClose();
          }}
        />
      </div>
    </>
  );
};

// Define the getLayout function
QuotesPage.getLayout = (page: React.ReactNode) => {
  return <MainLayout>{page}</MainLayout>;
};

export default QuotesPage;
