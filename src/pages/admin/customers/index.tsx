import React, { useState, useEffect, useCallback } from 'react';
import type { NextPageWithLayout } from '~/types/next';
import Head from 'next/head';
import {
  Button,
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
  Spinner,
  useDisclosure,
} from '@heroui/react';
import { Plus, Search, MoreVertical, Edit, Trash, Mail, Phone, Eye } from 'lucide-react';
import { MainLayout } from '~/layouts/MainLayout';
import { api } from '~/utils/api';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';
import { CustomerFormModal, type CustomerFormData } from '~/components/customers/CustomerFormModal';
import { DeleteEntityDialog } from '~/components/shared/DeleteEntityDialog';
import { useTranslation } from '~/hooks/useTranslation';
import { useAppToast } from '~/components/providers/ToastProvider';

// Get the types from the router
type RouterOutput = inferRouterOutputs<AppRouter>;

// Get the type from the getAll procedure's return type
type CustomerListResponse = RouterOutput['customer']['getAll'];
type CustomerItem = NonNullable<CustomerListResponse['customers']>[number];

const CustomersPage: NextPageWithLayout = () => {
  const { t, formatDate } = useTranslation();
  const toast = useAppToast();
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  // Modal state management using useDisclosure
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Fetch customers list data
  const {
    data: customersData,
    isLoading: isListLoading,
    refetch,
  } = api.customer.getAll.useQuery({
    page,
    limit: rowsPerPage,
    search: searchQuery,
  });
  const customers = customersData?.customers || [];
  const totalCustomers = customersData?.total || 0;

  // API Utils
  const utils = api.useUtils();

  // Fetch data for View Modal (when ID is selected and View modal is open)
  const customerDataForViewQuery = api.customer.getById.useQuery(
    { id: selectedCustomer?.id || '' },
    {
      enabled: !!selectedCustomer?.id && isViewOpen,
      refetchOnWindowFocus: false, // Optional: prevent refetch on focus
    }
  );

  // --- Define Mutations AFTER useDisclosure hooks ---
  const { mutate: createCustomer, isPending: isCreating } = api.customer.create.useMutation({
    onSuccess: () => {
      utils.customer.getAll.invalidate();
      toast.success(t('customers.createSuccess'));
      onCreateClose(); // Now in scope
    },
    onError: (error) => {
      toast.error(`${t('customers.createError')}: ${error.message}`);
    },
  });

  const { mutate: updateCustomer, isPending: isUpdating } = api.customer.update.useMutation({
    onSuccess: () => {
      utils.customer.getAll.invalidate();
      toast.success(t('customers.updateSuccess'));
      onEditClose(); // Now in scope
      setSelectedCustomer(null);
    },
    onError: (error) => {
      toast.error(`${t('customers.updateError')}: ${error.message}`);
    },
  });

  const { mutate: deleteCustomer, isPending: isDeleting } = api.customer.delete.useMutation({
    onSuccess: () => {
      utils.customer.getAll.invalidate();
      toast.success(t('customers.deleteSuccess'));
      onDeleteClose(); // Now in scope
      setSelectedCustomer(null);
    },
    onError: (error) => {
      toast.error(`${t('customers.deleteError')}: ${error.message}`);
    },
  });
  // --- End Mutations ---

  // Refetch list data when parameters change
  useEffect(() => {
    refetch();
  }, [page, rowsPerPage, searchQuery, refetch]);

  // === START: Define Modal Handlers ===
  const handleCreate = useCallback(() => {
    setSelectedCustomer(null);
    onCreateOpen();
  }, [onCreateOpen]);

  const handleEdit = useCallback(
    (customer: CustomerItem) => {
      setSelectedCustomer(customer);
      onEditOpen();
    },
    [onEditOpen]
  );

  const handleView = useCallback(
    (customer: CustomerItem) => {
      setSelectedCustomer(customer);
      onViewOpen();
    },
    [onViewOpen]
  );

  const handleDeleteRequest = useCallback(
    (customer: CustomerItem) => {
      setSelectedCustomer(customer);
      onDeleteOpen();
    },
    [onDeleteOpen]
  );
  // === END: Define Modal Handlers ===

  const renderCell = (customer: CustomerItem, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="flex flex-col">
            <p className="text-foreground font-medium">{customer.name}</p>
            {customer.address && (
              <p className="text-default-500 max-w-[200px] truncate text-xs">{customer.address}</p>
            )}
          </div>
        );
      case 'contact':
        return (
          <div className="flex flex-col gap-1">
            {customer.email && (
              <div className="flex items-center gap-1">
                <Mail size={14} className="text-default-500" />
                <span className="text-sm">{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-1">
                <Phone size={14} className="text-default-500" />
                <span className="text-sm">{customer.phone}</span>
              </div>
            )}
          </div>
        );
      case 'createdAt':
        return formatDate(customer.createdAt, 'short');
      case 'actions':
        return (
          <div className="flex items-center justify-end">
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
                  View
                </DropdownItem>
                <DropdownItem
                  key="edit"
                  startContent={<Edit size={16} />}
                  onPress={() => handleEdit(customer)}
                >
                  Edit
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  startContent={<Trash size={16} />}
                  className="text-danger"
                  color="danger"
                  onPress={() => handleDeleteRequest(customer)}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default: {
        const value = customer[columnKey as keyof CustomerItem];
        return typeof value === 'object' ? JSON.stringify(value) : String(value || '');
      }
    }
  };

  // Submit handlers with try...catch
  const handleCreateSubmit = useCallback(
    async (data: CustomerFormData) => {
      try {
        await createCustomer(data);
      } catch (error) {
        console.error('Create customer failed:', error);
      }
    },
    [createCustomer]
  );

  const handleUpdateSubmit = useCallback(
    async (data: CustomerFormData) => {
      if (selectedCustomer) {
        try {
          await updateCustomer({
            id: selectedCustomer.id,
            ...data,
          });
        } catch (error) {
          console.error('Update customer failed:', error);
        }
      }
    },
    [updateCustomer, selectedCustomer]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedCustomer) {
      try {
        await deleteCustomer({ id: selectedCustomer.id });
      } catch (error) {
        console.error('Delete customer failed:', error);
      }
    }
  }, [deleteCustomer, selectedCustomer]);

  // Determine which customer data to pass to the modal
  const customerForModal = isViewOpen
    ? (customerDataForViewQuery.data as CustomerItem | undefined) // Use fetched data for view
    : isCreateOpen
      ? undefined
      : (selectedCustomer ?? undefined); // Use state for create/edit

  return (
    <>
      <Head>
        <title>{t('customers.title')} | Construction Quote Manager</title>
      </Head>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        {/* Top Content */}
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{t('customers.title')}</h1>
            <Button color="primary" startContent={<Plus size={16} />} onPress={handleCreate}>
              {t('customers.new')}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <Input
              placeholder={t('customers.searchPlaceholder')}
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search size={16} className="text-default-300" />}
              className="w-full"
            />
          </div>
        </div>

        {/* Table */}
        {isListLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div>
            <Table aria-label="Customers table">
              <TableHeader>
                <TableColumn key="name">{t('customers.list.name').toUpperCase()}</TableColumn>
                <TableColumn key="contact">{t('customers.contact').toUpperCase()}</TableColumn>
                <TableColumn key="createdAt">
                  {t('customers.list.created').toUpperCase()}
                </TableColumn>
                <TableColumn key="actions" className="text-right">
                  {t('common.actions').toUpperCase()}
                </TableColumn>
              </TableHeader>
              <TableBody emptyContent="No customers found">
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    {['name', 'contact', 'createdAt', 'actions'].map((columnKey) => (
                      <TableCell key={columnKey}>{renderCell(customer, columnKey)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-center">
          <Pagination
            total={Math.ceil(totalCustomers / rowsPerPage)}
            page={page}
            onChange={setPage}
          />
        </div>
      </div>

      {/* Customer Form Modal (Handles Create/Edit/View) */}
      <CustomerFormModal
        customer={customerForModal}
        isOpen={isCreateOpen || isEditOpen || isViewOpen}
        onClose={isEditOpen ? onEditClose : isViewOpen ? onViewClose : onCreateClose}
        onSubmit={isEditOpen ? handleUpdateSubmit : handleCreateSubmit}
        isLoading={
          isEditOpen ? isUpdating : isViewOpen ? customerDataForViewQuery.isLoading : isCreating
        }
        isReadOnly={isViewOpen}
      />

      {/* Delete Customer Dialog */}
      <DeleteEntityDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        entityName="Customer"
        entityLabel={selectedCustomer?.name || ''}
      />
    </>
  );
};

// Define the getLayout function
CustomersPage.getLayout = (page) => <MainLayout>{page}</MainLayout>;

export default CustomersPage;
