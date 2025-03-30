import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Spinner,
  Pagination,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Card,
  CardHeader,
  CardBody,
  useDisclosure,
} from '@heroui/react';
import type { SortDescriptor } from '@heroui/react';

import type { Customer, CustomerWithQuotes } from '@/types/customer';
import { useQuery } from '@/hooks/useQuery';
import { useDeleteItem } from '@/hooks/useDeleteItem';
import { DeleteCustomerDialog } from '@/components/customers/DeleteCustomerDialog';
import { useEntityStore } from '@/store/entityStore';
import { formatDate } from '@/lib/utils';
import { usePagination } from '@/hooks/usePagination';

/**
 * Customer list page component that follows the shared CRUD pattern
 */
export default function CustomersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Set the entity settings for consistent UX
  const setEntitySettings = useEntityStore((state) => state.setEntitySettings);

  useEffect(() => {
    setEntitySettings({
      entityName: 'customer',
      entityType: 'customer',
      baseUrl: '/admin/customers',
      displayNameField: 'name',
      listPath: '/admin/customers',
      createPath: '/admin/customers/new',
      editPath: '/admin/customers/[id]/edit',
      viewPath: '/admin/customers/[id]',
    });
  }, [setEntitySettings]);

  // Setup pagination
  const { page, limit } = usePagination({
    defaultLimit: 10,
    syncWithUrl: true,
    total: 0, // Will be updated when data is fetched
  });

  // Setup sorting
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });

  // Query customers
  const { data, isLoading } = useQuery<{
    customers: CustomerWithQuotes[];
    total: number;
  }>('/api/customers', {
    page,
    limit,
    sortBy: sortDescriptor.column,
    sortDirection: sortDescriptor.direction === 'ascending' ? 'asc' : 'desc',
  });

  // Update pagination when total changes
  const paginationInfo = usePagination({
    defaultLimit: limit,
    total: data?.total || 0,
    syncWithUrl: true,
  });

  // Delete customer handler
  const { mutate: deleteCustomer, isLoading: isDeleting } = useDeleteItem<Customer>({
    endpoint: '/api/customers',
    onSuccess: () => {
      onDeleteClose();
      setCustomerToDelete(null);
    },
  });

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    onDeleteOpen();
  };

  const handleDeleteConfirm = () => {
    if (customerToDelete) {
      deleteCustomer({ id: customerToDelete.id });
    }
  };

  // Handler for sorting changes
  const handleSortChange = (descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
  };

  // Columns for the HeroUI table
  const columns = [
    {
      key: 'displayId',
      label: t('customers.fields.id'),
    },
    {
      key: 'name',
      label: t('customers.fields.name'),
      sortable: true,
    },
    {
      key: 'email',
      label: t('customers.fields.email'),
      sortable: true,
    },
    {
      key: 'createdAt',
      label: t('customers.fields.created_at'),
      sortable: true,
    },
    {
      key: 'actions',
      label: t('common.actions'),
    },
  ];

  // Render cell content based on column key
  const renderCell = (customer: CustomerWithQuotes, columnKey: React.Key) => {
    switch (columnKey) {
      case 'displayId':
        return <span>{customer.displayId || customer.id.substring(0, 8)}</span>;

      case 'name':
        return (
          <Link
            href={`/admin/customers/${customer.id}`}
            className="text-blue-600 hover:text-blue-900"
          >
            {customer.name}
          </Link>
        );

      case 'email':
        return <span>{customer.email}</span>;

      case 'createdAt':
        return <span>{formatDate(customer.createdAt)}</span>;

      case 'actions':
        return (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              color="primary"
              variant="flat"
              as={Link}
              href={`/admin/customers/${customer.id}/edit`}
            >
              {t('common.edit')}
            </Button>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              onPress={() => handleDeleteClick(customer)}
            >
              {t('common.delete')}
            </Button>
          </div>
        );

      default:
        // Safe fallback that returns a React node
        return <span>{String(customer[columnKey as keyof CustomerWithQuotes] || '')}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold">{t('customers.title')}</h1>
          <Button
            color="primary"
            as={Link}
            href={'/admin/customers/new'}
            startContent={<span>+</span>}
          >
            {t('customers.new')}
          </Button>
        </CardHeader>

        <CardBody className="p-4">
          <Table
            aria-label="Customers table"
            sortDescriptor={sortDescriptor}
            onSortChange={handleSortChange}
            bottomContent={
              data?.total && data.total > 0 ? (
                <div className="flex justify-center">
                  <Pagination
                    page={paginationInfo.page}
                    total={paginationInfo.totalPages}
                    onChange={paginationInfo.setPage}
                    showControls
                    showShadow
                    color="primary"
                  />
                </div>
              ) : null
            }
            classNames={{
              wrapper: 'shadow-none',
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  allowsSorting={column.sortable}
                  align={column.key === 'actions' ? 'end' : 'start'}
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={data?.customers || []}
              emptyContent={
                isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="md" color="primary" />
                    <span className="ml-2">{t('common.loading')}</span>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">{t('customers.empty')}</p>
                    <Button
                      color="primary"
                      className="mt-4"
                      onPress={() => router.push('/admin/customers/new')}
                    >
                      {t('customers.actions.create_first')}
                    </Button>
                  </div>
                )
              }
              isLoading={isLoading}
              loadingContent={
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" color="primary" />
                  <span className="ml-2">{t('common.loading')}</span>
                </div>
              }
            >
              {(customer) => (
                <TableRow
                  key={customer.id}
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                >
                  {(columnKey) => <TableCell>{renderCell(customer, columnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {customerToDelete && (
        <DeleteCustomerDialog
          isOpen={isDeleteOpen}
          customer={customerToDelete}
          isDeleting={isDeleting}
          onClose={onDeleteClose}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
