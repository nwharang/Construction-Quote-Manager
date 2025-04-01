import React, { useState, useEffect } from 'react';
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
} from '@heroui/react';
import { Plus, Search, MoreVertical, Edit, Trash, Mail, Phone, Eye } from 'lucide-react';
import MainLayout from '~/layouts/MainLayout';
import { api } from '~/utils/api';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';
import { CustomerFormModal } from '~/components/customers/CustomerFormModal';
import { DeleteEntityDialog } from '~/components/shared/DeleteEntityDialog';
import { useModalCRUD } from '~/hooks/useModalCRUD';

// Get the types from the router
type RouterOutput = inferRouterOutputs<AppRouter>;

// Get the type from the getAll procedure's return type
type CustomerListResponse = RouterOutput['customer']['getAll'];
type CustomerItem = NonNullable<CustomerListResponse['customers']>[number];
type CustomerFormData = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
};

const CustomersPage: NextPageWithLayout = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState<'ascending' | 'descending'>('ascending');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  // Fetch customers data with sorting
  const {
    data: customersData,
    isLoading,
    refetch,
  } = api.customer.getAll.useQuery({
    page,
    limit: rowsPerPage,
    search: searchQuery,
  });
  const customers = customersData?.customers || [];
  const totalCustomers = customersData?.total || 0;

  // API mutations
  const utils = api.useUtils();
  
  const { mutate: createCustomer, isPending: isCreating } = api.customer.create.useMutation({
    onSuccess: () => {
      utils.customer.getAll.invalidate();
      modal.handleCreateSuccess();
    },
  });
  
  const { mutate: updateCustomer, isPending: isUpdating } = api.customer.update.useMutation({
    onSuccess: () => {
      utils.customer.getAll.invalidate();
      modal.handleUpdateSuccess();
    },
  });
  
  const { mutate: deleteCustomer, isPending: isDeleting } = api.customer.delete.useMutation({
    onSuccess: () => {
      utils.customer.getAll.invalidate();
      modal.handleDeleteSuccess();
    },
  });

  // Use the modal CRUD hook
  const modal = useModalCRUD({
    onCreateSuccess: () => setSelectedCustomer(null),
    onUpdateSuccess: () => setSelectedCustomer(null),
    onDeleteSuccess: () => setSelectedCustomer(null),
  });

  // Fetch the customer data if we're in edit or view mode
  const { data: customerData } = api.customer.getById.useQuery(
    { id: modal.modalState.entityId || '' },
    { 
      enabled: !!modal.modalState.entityId && (modal.isEdit || modal.isView || modal.isDelete),
    }
  );

  // Update selected customer when data is fetched
  useEffect(() => {
    if (customerData) {
      // Force type to work around potential missing fields
      setSelectedCustomer(customerData as unknown as CustomerItem);
    }
  }, [customerData]);

  // Refetch data when sort or search parameters change
  useEffect(() => {
    refetch();
  }, [page, rowsPerPage, searchQuery, refetch]);

  // Handle sort change
  const handleSortChange = (columnKey: string) => {
    if (columnKey === sortColumn) {
      setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending');
    } else {
      setSortColumn(columnKey);
      setSortDirection('ascending');
    }
    // Reset to first page when sorting changes
    setPage(1);
  };

  // Submit handlers
  const handleCreateSubmit = async (data: CustomerFormData) => {
    modal.setLoading(true);
    try {
      await createCustomer(data);
    } finally {
      modal.setLoading(false);
    }
  };

  const handleUpdateSubmit = async (data: CustomerFormData) => {
    if (modal.modalState.entityId) {
      modal.setLoading(true);
      try {
        await updateCustomer({
          id: modal.modalState.entityId,
          ...data,
        });
      } finally {
        modal.setLoading(false);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (modal.modalState.entityId) {
      modal.setLoading(true);
      try {
        await deleteCustomer({ id: modal.modalState.entityId });
      } finally {
        modal.setLoading(false);
      }
    }
  };

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
        return customer.createdAt instanceof Date
          ? customer.createdAt.toLocaleDateString()
          : new Date(customer.createdAt).toLocaleDateString();
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
                  onPress={() => modal.openViewModal(customer.id)}
                >
                  View
                </DropdownItem>
                <DropdownItem
                  key="edit"
                  startContent={<Edit size={16} />}
                  onPress={() => modal.openEditModal(customer.id)}
                >
                  Edit
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  startContent={<Trash size={16} />}
                  className="text-danger"
                  color="danger"
                  onPress={() => modal.openDeleteModal(customer.id)}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        const value = customer[columnKey as keyof CustomerItem];
        return typeof value === 'object' ? JSON.stringify(value) : String(value || '');
    }
  };

  return (
    <>
      <Head>
        <title>Customers | Construction Quote Manager</title>
      </Head>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        {/* Top Content */}
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Customers</h1>
            <Button
              color="primary"
              startContent={<Plus size={16} />}
              onPress={modal.openCreateModal}
            >
              New Customer
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search size={16} className="text-default-300" />}
              className="w-full"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div>
            <Table aria-label="Customers table">
              <TableHeader>
                <TableColumn key="name">CUSTOMER</TableColumn>
                <TableColumn key="contact">CONTACT</TableColumn>
                <TableColumn key="createdAt">CREATED</TableColumn>
                <TableColumn key="actions" className="text-right">
                  ACTIONS
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

      {/* Customer Form Modal */}
      <CustomerFormModal
        customer={selectedCustomer || undefined}
        isOpen={modal.modalState.isOpen && (modal.isCreate || modal.isEdit || modal.isView)}
        onClose={modal.closeModal}
        onSubmit={modal.isEdit ? handleUpdateSubmit : handleCreateSubmit}
        isLoading={modal.modalState.isLoading}
      />

      {/* Delete Customer Dialog */}
      <DeleteEntityDialog
        isOpen={modal.modalState.isOpen && modal.isDelete}
        onClose={modal.closeModal}
        onConfirm={handleDeleteConfirm}
        isLoading={modal.modalState.isLoading}
        entityName="Customer"
        entityLabel={selectedCustomer?.name || ""}
      />
    </>
  );
};

// Define the getLayout function
CustomersPage.getLayout = (page) => <MainLayout>{page}</MainLayout>;

export default CustomersPage;
