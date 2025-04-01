'use client';

import React, { useState } from 'react';
import { type InferSelectModel } from 'drizzle-orm';
import { products } from '~/server/db/schema';
import { api } from '~/utils/api';
import { useAppToast } from '~/components/providers/ToastProvider';
import { 
  EntityList, 
  type EntityColumn 
} from '~/components/shared/EntityList';
import { DeleteEntityDialog } from '~/components/shared/EntityDialog';
import { formatCurrency, formatDate } from '~/utils/formatters';

type Product = InferSelectModel<typeof products>;

export function ProductsList() {
  const toast = useAppToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const pageSize = 10;
  
  // Get products data with search and pagination
  const { 
    data, 
    isLoading,
    refetch 
  } = api.product.getAll.useQuery({
    search: searchQuery,
    page,
    limit: pageSize
  });
  
  // Delete product mutation
  const deleteProductMutation = api.product.delete.useMutation({
    onSuccess: () => {
      toast.success('Product deleted successfully');
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Error deleting product: ${error.message}`);
    }
  });
  
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    if (selectedProduct) {
      deleteProductMutation.mutate({ id: selectedProduct.id });
    }
  };
  
  // Define columns for product list
  const columns: EntityColumn<Product>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true
    },
    {
      key: 'category',
      label: 'Category',
      render: (product) => product.category || '-'
    },
    {
      key: 'unitPrice',
      label: 'Price',
      render: (product) => formatCurrency(parseFloat(product.unitPrice.toString()))
    },
    {
      key: 'unit',
      label: 'Unit',
      render: (product) => product.unit || '-'
    },
    {
      key: 'sku',
      label: 'SKU',
      render: (product) => product.sku || '-'
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (product) => formatDate(product.createdAt)
    }
  ];
  
  return (
    <>
      <EntityList
        title="Products"
        entities={data?.products || []}
        columns={columns}
        baseUrl="/products"
        isLoading={isLoading}
        enableSearch={true}
        searchPlaceholder="Search products..."
        onSearchChange={setSearchQuery}
        pagination={{
          page,
          pageSize,
          total: data?.totalCount || 0,
          onPageChange: setPage
        }}
        onDelete={handleDeleteClick}
        emptyStateMessage="No products found"
        emptyStateAction={{
          label: "Add Product",
          onClick: () => window.location.href = '/products/new',
          icon: <span>+</span>
        }}
      />
      
      {selectedProduct && (
        <DeleteEntityDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          isDeleting={deleteProductMutation.isPending}
          title="Delete Product"
          entityName={selectedProduct.name}
          entityType="product"
        />
      )}
    </>
  );
} 