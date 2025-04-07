'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import { api } from '~/utils/api';
import { DeleteEntityDialog } from '~/components/shared/DeleteEntityDialog';
import { useDisclosure } from '@heroui/react';
import { useAppToast } from '~/components/providers/ToastProvider';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tabs,
  Tab,
  Tooltip,
} from '@heroui/react';
import {
  Plus,
  Search,
  LayoutGrid,
  LayoutList,
  FileText,
  Users,
  Calendar,
  CircleDollarSign,
  MoreVertical,
  Eye,
  Edit,
  Trash,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useUIStore } from '~/store/uiStore';
import type { QuoteListItem } from '~/types/quote';
import { routes } from '~/config/routes';
import { ListToolbar } from '~/components/shared/ListToolbar';

// Map status to display settings
const QuoteStatusSettings: Record<
  string,
  { color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'; label: string }
> = {
  DRAFT: { color: 'default', label: 'Draft' },
  SENT: { color: 'primary', label: 'Sent' },
  ACCEPTED: { color: 'success', label: 'Accepted' },
  REJECTED: { color: 'danger', label: 'Rejected' },
};

export function QuotesList() {
  const { t, formatDate, formatCurrency } = useTranslation();
  const toast = useAppToast();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [quoteToDelete, setQuoteToDelete] = useState<QuoteListItem | null>(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [viewType, setViewType] = useState<'card' | 'table'>('card'); // Default to card view
  const [sortColumn, setSortColumn] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'ascending' | 'descending'>('descending');

  // Use UI settings from the store
  const { tableSettings, buttonSettings } = useUIStore();

  const pageSize = 10;

  // API Utils for invalidation
  const utils = api.useUtils();

  // Get quotes data with search and pagination
  const { data: quotesData, isLoading } = api.quote.getAll.useQuery({
    page,
    limit: pageSize,
    search,
    sortBy: sortColumn,
    sortOrder: sortDirection === 'ascending' ? 'asc' : 'desc',
  });

  // Extract quotes and pagination info from API response
  const quotes = useMemo(() => {
    if (!quotesData?.items) return [];
    
    // Map API response to QuoteListItem type
    return quotesData.items.map(item => ({
      id: item.id,
      sequentialId: item.sequentialId,
      title: item.title,
      customerId: item.customerId,
      customerName: item.customerName || item.customer?.name || null,
      status: item.status,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : String(item.updatedAt),
      grandTotal: Number(item.grandTotal),
      markupPercentage: Number(item.markupPercentage),
      notes: item.notes,
    }));
  }, [quotesData]);
  
  const totalPages = quotesData?.totalPages || 1;

  // --- Delete Mutation ---
  const { mutate: deleteQuote, isPending: isDeleting } = api.quote.delete.useMutation({
    onSuccess: () => {
      utils.quote.getAll.invalidate(); // Invalidate list query
      toast.success(t('quotes.deleteSuccess'));
      onDeleteClose();
      setQuoteToDelete(null);
    },
    onError: (error) => {
      toast.error(t('quotes.deleteError', { message: error.message }));
      onDeleteClose();
      setQuoteToDelete(null);
    },
  });

  // --- Action Handlers ---
  const handleCreateQuote = useCallback(() => {
    router.push(routes.admin.quotes.new);
  }, [router]);

  const handleView = useCallback(
    (quote: QuoteListItem) => {
      router.push(routes.admin.quotes.detail(quote.id));
    },
    [router]
  );

  const handleEdit = useCallback(
    (quote: QuoteListItem) => {
      router.push(routes.admin.quotes.edit(quote.id));
    },
    [router]
  );

  const handleDeleteRequest = useCallback(
    (quote: QuoteListItem) => {
      setQuoteToDelete(quote);
      onDeleteOpen();
    },
    [onDeleteOpen]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (quoteToDelete) {
      try {
        await deleteQuote({ id: quoteToDelete.id });
      } catch (error) {
        // Error handled by onError mutation handler
        console.error('Delete quote failed:', error);
      }
    }
  }, [deleteQuote, quoteToDelete]);

  // Column definitions
  const columns = useMemo(
    () => [
      { uid: 'sequentialId', name: t('quotes.list.id') },
      { uid: 'title', name: t('quotes.list.title') },
      { uid: 'customerName', name: t('quotes.list.customer'), hideOnMobile: true },
      { uid: 'status', name: t('quotes.list.status') },
      { uid: 'createdAt', name: t('quotes.list.created'), hideOnMobile: true },
      { uid: 'grandTotal', name: t('quotes.list.total'), hideOnMobile: true },
      { uid: 'actions', name: t('common.actions') },
    ],
    [t]
  );

  // Filter columns for mobile view
  const visibleColumns = useMemo(() => {
    // On larger screens, show all columns
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return columns;
    }
    // On mobile, filter out columns marked as hideOnMobile
    return columns.filter((col) => !col.hideOnMobile);
  }, [columns]);

  // Render cell content
  const renderCell = useCallback(
    (quote: QuoteListItem, columnKey: React.Key) => {
      switch (columnKey) {
        case 'sequentialId':
          return <span className="font-medium">#{quote.sequentialId || '-'}</span>;
        case 'title':
          return (
            <div className="flex flex-col">
              <p className="text-foreground font-medium">{quote.title}</p>
              {quote.notes && (
                <p className="text-default-500 max-w-[200px] truncate text-xs">
                  {quote.notes}
                </p>
              )}
            </div>
          );
        case 'customerName':
          return quote.customerName ?? '-';
        case 'status': {
          const statusInfo = QuoteStatusSettings[quote.status] || { color: 'default', label: quote.status };
          return (
            <Chip
              color={statusInfo.color}
              variant="flat"
              size="sm"
              className="capitalize"
            >
              {statusInfo.label}
            </Chip>
          );
        }
        case 'createdAt':
          return quote.createdAt ? formatDate(new Date(quote.createdAt), 'short') : '-';
        case 'grandTotal':
          return formatCurrency(Number(quote.grandTotal));
        case 'actions':
          return (
            <div className="flex justify-end">
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="light" size="sm">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Quote actions">
                  <DropdownItem
                    key="view"
                    startContent={<Eye size={16} />}
                    onPress={() => handleView(quote)}
                  >
                    {t('common.view')}
                  </DropdownItem>
                  <DropdownItem
                    key="edit"
                    startContent={<Edit size={16} />}
                    onPress={() => handleEdit(quote)}
                  >
                    {t('common.edit')}
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
          return String(quote[columnKey as keyof QuoteListItem] || '-');
      }
    },
    [handleView, handleEdit, handleDeleteRequest, t, formatDate, formatCurrency]
  );

  // Render the card view for a quote
  const renderQuoteCard = useCallback(
    (quote: QuoteListItem) => (
      <Card
        key={quote.id}
        shadow="sm"
        radius="lg"
        isHoverable
        className="overflow-hidden"
        as="div" // Force it to render as a div instead of a button
      >
        {/* Card Header */}
        <div 
          className="flex flex-col cursor-pointer" 
          onClick={() => handleView(quote)}
        >
          <CardHeader className="flex flex-col items-start p-4 pb-3">
            <div className="flex w-full items-center justify-between">
              <h3 className="text-lg font-semibold">{quote.title}</h3>
              <span className="text-foreground-500 text-sm font-mono">#{quote.sequentialId || ''}</span>
            </div>
            <p className="text-default-400 mt-1 text-[11px]">
              {quote.createdAt ? formatDate(new Date(quote.createdAt), 'short') : '-'}
            </p>
          </CardHeader>

          <Divider className="opacity-50" />

          <CardBody className="p-4">
            <div className="flex flex-col gap-4">
              {/* Status field */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full">
                  <FileText size={14} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-default-400 text-xs">{t('quotes.list.status')}</p>
                  <div className="mt-1">
                    {(() => {
                      const statusInfo = QuoteStatusSettings[quote.status] || { color: 'default', label: quote.status };
                      return (
                        <Chip
                          color={statusInfo.color}
                          size="sm"
                          variant="flat"
                          className="capitalize"
                        >
                          {statusInfo.label}
                        </Chip>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Customer field */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full">
                  <Users size={14} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-default-400 text-xs">{t('quotes.list.customer')}</p>
                  <p className="text-sm">{quote.customerName ?? '-'}</p>
                </div>
              </div>

              {/* Grand Total field */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full">
                  <CircleDollarSign size={14} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-default-400 text-xs">{t('quotes.list.total')}</p>
                  <p className="text-sm font-medium">{formatCurrency(Number(quote.grandTotal))}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </div>

        <div
          className="border-default-100 flex gap-2 border-t p-3"
        >
          <Button
            size="sm"
            color="primary"
            variant="flat"
            startContent={<Eye size={16} />}
            onPress={() => handleView(quote)}
            className="flex-1"
          >
            {t('common.view')}
          </Button>
          <Button
            size="sm"
            color="default"
            variant="flat"
            startContent={<Edit size={16} />}
            onPress={() => handleEdit(quote)}
            className="flex-1"
          >
            {t('common.edit')}
          </Button>
          <Button
            size="sm"
            color="danger"
            variant="flat"
            startContent={<Trash size={16} />}
            onPress={() => handleDeleteRequest(quote)}
            className="flex-1"
          >
            {t('common.delete')}
          </Button>
        </div>
      </Card>
    ),
    [handleView, handleEdit, handleDeleteRequest, t, formatDate, formatCurrency]
  );

  // Render empty state
  const renderEmptyState = useCallback(
    () => (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-default-500 mb-4 text-lg">{t('common.noResults')}</p>
        <Button color="primary" startContent={<Plus size={16} />} onPress={handleCreateQuote}>
          {t('common.new')}
        </Button>
      </div>
    ),
    [t, handleCreateQuote]
  );

  // Render loading state
  const renderLoadingState = useCallback(
    () => (
      <div className="flex h-[300px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    ),
    []
  );

  return (
    <div className="space-y-4">
      <ListToolbar
        viewType={viewType}
        onViewTypeChange={(type) => setViewType(type)}
        searchValue={search}
        onSearchChange={setSearch}
        onCreateClick={handleCreateQuote}
        createButtonLabel={t('common.create')}
        searchPlaceholder={t('quotes.list.searchPlaceholder')}
      />
      
      <Card className="w-full">
        <CardBody className="px-2 sm:px-4">
          {isLoading ? (
            renderLoadingState()
          ) : (quotes?.length ?? 0) === 0 ? (
            renderEmptyState()
          ) : viewType === 'card' ? (
            // Card View - single column on mobile
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {quotes.map(renderQuoteCard)}
            </div>
          ) : (
            // Table View - responsive with horizontal scroll on small screens
            <div className="-mx-2 sm:-mx-4 overflow-x-auto">
              <Table
                aria-label="Quotes table"
                isStriped={tableSettings.stripedRows}
                isHeaderSticky
                classNames={{
                  wrapper: 'max-h-[calc(100vh-350px)] min-w-[600px]',
                  th: 'bg-default-100/80 backdrop-blur-md text-xs sm:text-sm',
                  td: 'text-xs sm:text-sm py-2 sm:py-4',
                }}
              >
                <TableHeader>
                  {visibleColumns.map((column) => (
                    <TableColumn key={column.uid}>{column.name}</TableColumn>
                  ))}
                </TableHeader>
                <TableBody
                  items={quotes ?? []}
                  emptyContent={t('common.noResults')}
                >
                  {(item) => (
                    <TableRow key={item.id} className="hover:bg-default-50">
                      {visibleColumns.map((column) => (
                        <TableCell key={column.uid}>{renderCell(item, column.uid)}</TableCell>
                      ))}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination - only show if we have more than one page */}
          {totalPages > 1 && (
            <div className="mt-4 sm:mt-6 flex justify-center">
              <Pagination
                page={page}
                total={totalPages}
                onChange={setPage}
                size="sm"
                showControls
                classNames={{
                  item: 'w-8 h-8',
                }}
              />
            </div>
          )}
        </CardBody>

        {/* Delete Confirmation Dialog */}
        <DeleteEntityDialog
          isOpen={isDeleteOpen}
          onClose={onDeleteClose}
          onConfirm={handleDeleteConfirm}
          isLoading={isDeleting}
          entityName={t('quotes.entityName')}
          entityLabel={quoteToDelete?.title ?? ''}
        />
      </Card>
    </div>
  );
} 