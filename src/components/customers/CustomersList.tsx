'use client';

import React, { useState } from 'react';
import { type InferSelectModel } from 'drizzle-orm';
import { customers } from '~/server/db/schema';
import { api } from '~/utils/api';
import { useAppToast } from '~/components/providers/ToastProvider';
import { 
  EntityList, 
  type EntityColumn 
} from '~/components/shared/EntityList';
import { DeleteCustomerDialog } from './DeleteCustomerDialog';
import { formatDate } from '~/utils/formatters';

type Customer = InferSelectModel<typeof customers>;

export function CustomersList() {
  const toast = useAppToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const pageSize = 10;
  
  // Get customers data with search and pagination
  const { 
    data, 
    isLoading,
    refetch 
  } = api.customer.getAll.useQuery({
    search: searchQuery,
    page,
    limit: pageSize
  });
  
  // Delete customer mutation
  const deleteCustomerMutation = api.customer.delete.useMutation({
    onSuccess: () => {
      toast.success('Customer deleted successfully');
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Error deleting customer: ${error.message}`);
    }
  });
  
  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    if (selectedCustomer) {
      deleteCustomerMutation.mutate({ id: selectedCustomer.id });
    }
  };
  
  // Define columns for customer list
  const columns: EntityColumn<Customer>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true
    },
    {
      key: 'email',
      label: 'Email',
      render: (customer) => customer.email || '-'
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (customer) => customer.phone || '-'
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (customer) => formatDate(customer.createdAt)
    }
  ];
  
  return (
    <>
      <EntityList
        title="Customers"
        entities={data?.customers || []}
        columns={columns}
        baseUrl="/customers"
        isLoading={isLoading}
        enableSearch={true}
        searchPlaceholder="Search customers..."
        onSearchChange={setSearchQuery}
        pagination={{
          page,
          pageSize,
          total: data?.totalCount || 0,
          onPageChange: setPage
        }}
        onDelete={handleDeleteClick}
        emptyStateMessage="No customers found"
        emptyStateAction={{
          label: "Add Customer",
          onClick: () => window.location.href = '/customers/new',
          icon: <span>+</span>
        }}
      />
      
      {selectedCustomer && (
        <DeleteCustomerDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          customer={selectedCustomer}
          isDeleting={deleteCustomerMutation.isPending}
        />
      )}
    </>
  );
} 