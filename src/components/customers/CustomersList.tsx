'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import { api, type RouterOutputs } from '~/utils/api';
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
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash,
  MapPin,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '~/store/uiStore';

// Use inferred type from the API output for the list items
type CustomerListItem = RouterOutputs['customer']['getAll']['customers'][number];

export function CustomersList() {
  const { t, formatDate } = useTranslation();
  const toast = useAppToast();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerListItem | null>(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [viewType, setViewType] = useState<'card' | 'table'>('card'); // Default to card view as per LIST_PAGES_CONCEPT.md

  // Use UI settings from the store
  const { tableSettings, buttonSettings } = useUIStore();

  const pageSize = 10;

  // API Utils for invalidation
  const utils = api.useUtils();

  // Get customers data with search and pagination
  const { data: customersData, isLoading } = api.customer.getAll.useQuery({
    page,
    limit: pageSize,
    search: search,
  });

  // --- Delete Mutation ---
  const { mutate: deleteCustomer, isPending: isDeleting } = api.customer.delete.useMutation({
    onSuccess: () => {
      utils.customer.getAll.invalidate(); // Invalidate list query
      toast.success(t('customers.deleteSuccess'));
      onDeleteClose();
      setCustomerToDelete(null);
    },
    onError: (error) => {
      toast.error(t('customers.deleteError', { message: error.message }));
      onDeleteClose();
      setCustomerToDelete(null);
    },
  });

  // --- Action Handlers ---
  const handleCreateCustomer = useCallback(() => {
    router.push('/admin/customers/new');
  }, [router]);

  const handleView = useCallback(
    (customer: CustomerListItem) => {
      router.push(`/admin/customers/${customer.id}/view`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (customer: CustomerListItem) => {
      router.push(`/admin/customers/${customer.id}/edit`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback(
    (customer: CustomerListItem) => {
      setCustomerToDelete(customer);
      onDeleteOpen();
    },
    [onDeleteOpen]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (customerToDelete) {
      try {
        await deleteCustomer({ id: customerToDelete.id });
      } catch (error) {
        // Error handled by onError mutation handler
        console.error('Delete customer failed:', error);
      }
    }
  }, [deleteCustomer, customerToDelete]);

  // Column definitions
  const columns = useMemo(
    () => [
      { uid: 'name', name: t('customers.list.name') },
      { uid: 'email', name: t('customers.list.email'), hideOnMobile: true },
      { uid: 'phone', name: t('customers.list.phone'), hideOnMobile: true },
      { uid: 'createdAt', name: t('customers.list.created'), hideOnMobile: true },
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
    (customer: CustomerListItem, columnKey: React.Key) => {
      switch (columnKey) {
        case 'name':
          return (
            <div className="flex flex-col">
              <p className="text-foreground font-medium">{customer.name}</p>
              {customer.address && (
                <p className="text-default-500 max-w-[200px] truncate text-xs">
                  {customer.address}
                </p>
              )}
            </div>
          );
        case 'email':
          return customer.email ? (
            <Tooltip content={customer.email}>
              <span className="inline-block max-w-[150px] truncate">{customer.email}</span>
            </Tooltip>
          ) : (
            '-'
          );
        case 'phone':
          return customer.phone || '-';
        case 'createdAt':
          return customer.createdAt ? formatDate(customer.createdAt, 'short') : '-';
        case 'actions':
          return (
            <div className="flex justify-end">
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="light" size="sm">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Customer actions">
                  <DropdownItem
                    key="view"
                    startContent={<Eye size={16} />}
                    onPress={() => handleView(customer)}
                  >
                    {t('common.view')}
                  </DropdownItem>
                  <DropdownItem
                    key="edit"
                    startContent={<Edit size={16} />}
                    onPress={() => handleEdit(customer)}
                  >
                    {t('common.edit')}
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    startContent={<Trash size={16} />}
                    className="text-danger"
                    color="danger"
                    onPress={() => handleDeleteRequest(customer)}
                  >
                    {t('common.delete')}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return String(customer[columnKey as keyof CustomerListItem] || '-');
      }
    },
    [handleView, handleEdit, handleDeleteRequest, t, formatDate]
  );

  // Render the card view for a customer
  const renderCustomerCard = useCallback(
    (customer: CustomerListItem) => (
      <Card
        key={customer.id}
        shadow="sm"
        radius="lg"
        isHoverable
        isPressable
        onPress={() => handleView(customer)}
        classNames={{
          base: 'overflow-hidden',
          body: 'p-0',
        }}
      >
        {/* Card Header */}
        <CardHeader className="flex flex-col items-start p-4 pb-3">
          <h3 className="text-lg font-semibold">{customer.name}</h3>
          <p className="text-default-400 mt-1 text-[11px]">
            {customer.createdAt ? formatDate(customer.createdAt, 'short') : '-'}
          </p>
        </CardHeader>

        <Divider className="opacity-50" />

        <CardBody className="p-4">
          <div className="flex flex-col gap-4">
            {/* Always show address field */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full">
                <MapPin size={14} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-default-400 text-xs">{t('customers.contact')}</p>
                <p className="text-sm">{customer.address || '-'}</p>
              </div>
            </div>

            {/* Always show email field */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full">
                <Mail size={14} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-default-400 text-xs">{t('customers.list.email')}</p>
                {customer.email ? (
                  <Tooltip content={customer.email}>
                    <p className="truncate text-sm">{customer.email}</p>
                  </Tooltip>
                ) : (
                  <p className="text-default-400 text-sm">-</p>
                )}
              </div>
            </div>

            {/* Always show phone field */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full">
                <Phone size={14} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-default-400 text-xs">{t('customers.list.phone')}</p>
                <p className="text-sm">{customer.phone || '-'}</p>
              </div>
            </div>
          </div>
        </CardBody>

        <div
          className="border-default-100 flex gap-2 border-t p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            color="primary"
            variant="flat"
            startContent={<Eye size={16} />}
            onPress={() => handleView(customer)}
            className="flex-1"
          >
            {t('common.view')}
          </Button>
          <Button
            size="sm"
            color="default"
            variant="flat"
            startContent={<Edit size={16} />}
            onPress={() => handleEdit(customer)}
            className="flex-1"
          >
            {t('common.edit')}
          </Button>
          <Button
            size="sm"
            color="danger"
            variant="flat"
            startContent={<Trash size={16} />}
            onPress={() => handleDeleteRequest(customer)}
            className="flex-1"
          >
            {t('common.delete')}
          </Button>
        </div>
      </Card>
    ),
    [handleView, handleEdit, handleDeleteRequest, t, formatDate]
  );

  // Render empty state
  const renderEmptyState = useCallback(
    () => (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-default-500 mb-4 text-lg">{t('common.noResults')}</p>
        <Button color="primary" startContent={<Plus size={16} />} onPress={handleCreateCustomer}>
          {t('common.new')}
        </Button>
      </div>
    ),
    [t, handleCreateCustomer]
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
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-y-4 sm:flex-row">
        {/* First row: View toggle and search */}
        <div className="flex w-full flex-row items-start gap-3 sm:items-center">
          {/* View Toggle */}
          <Tabs
            selectedKey={viewType}
            onSelectionChange={(key) => setViewType(key as 'card' | 'table')}
            aria-label="View Options"
            size="sm"
            className="sm:w-auto"
          >
            <Tab
              key="card"
              title={
                <div className="flex items-center gap-2">
                  <LayoutGrid size={16} />
                  <span className="hidden sm:inline">{t('common.cardView')}</span>
                </div>
              }
            />
            <Tab
              key="table"
              title={
                <div className="flex items-center gap-2">
                  <LayoutList size={16} />
                  <span className="hidden sm:inline">{t('common.tableView')}</span>
                </div>
              }
            />
          </Tabs>

          {/* Search Input */}
          <Input
            placeholder={t('customers.list.searchPlaceholder')}
            value={search}
            onValueChange={setSearch}
            startContent={<Search size={16} className="text-default-300" />}
            size={buttonSettings.size === 'sm' ? 'sm' : buttonSettings.size === 'lg' ? 'lg' : 'md'}
            className="w-full flex-1 sm:w-auto sm:max-w-md"
          />
        </div>

        {/* Second row: New button */}
        <div className="flex w-full justify-end">
          <Button
            color="primary"
            startContent={<Plus size={16} />}
            onPress={handleCreateCustomer}
            size={buttonSettings.size === 'sm' ? 'sm' : buttonSettings.size === 'lg' ? 'lg' : 'md'}
            className="w-fit sm:w-auto"
          >
            <span className="hidden sm:inline">{t('common.new')}</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        {isLoading ? (
          renderLoadingState()
        ) : (customersData?.customers?.length ?? 0) === 0 ? (
          renderEmptyState()
        ) : viewType === 'card' ? (
          // Card View
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {customersData?.customers.map(renderCustomerCard)}
          </div>
        ) : (
          // Table View - responsive with horizontal scroll on small screens
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <Table
              aria-label="Customers table"
              isStriped={tableSettings.stripedRows}
              isHeaderSticky
              classNames={{
                wrapper: 'max-h-[calc(100vh-350px)] min-w-[600px]',
                th: 'bg-default-100/80 backdrop-blur-md',
              }}
            >
              <TableHeader>
                {visibleColumns.map((column) => (
                  <TableColumn key={column.uid}>{column.name}</TableColumn>
                ))}
              </TableHeader>
              <TableBody
                items={customersData?.customers ?? []}
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

        {/* Pagination */}
        {(customersData?.total ?? 0) > pageSize && (
          <div className="mt-6 flex justify-center">
            <Pagination
              page={page}
              total={Math.ceil((customersData?.total ?? 0) / pageSize)}
              onChange={setPage}
              size={
                buttonSettings.size === 'sm' ? 'sm' : buttonSettings.size === 'lg' ? 'lg' : 'md'
              }
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
        entityName={t('customers.entityName')}
        entityLabel={customerToDelete?.name ?? ''}
      />
    </Card>
  );
}
