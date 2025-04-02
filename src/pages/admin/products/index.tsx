import React from 'react';
import { useState, useEffect } from 'react';
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
import { Plus, Search, MoreVertical, Edit, Trash, Eye } from 'lucide-react';
import { api } from '~/utils/api';
import { MainLayout } from '~/layouts';
import type { NextPageWithLayout } from '~/types/next';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';
import { ProductFormModal, type ProductSubmitData } from '~/components/products/ProductFormModal';
import { DeleteEntityDialog } from '~/components/shared/DeleteEntityDialog';
import { useTranslation } from '~/hooks/useTranslation';
import { useAppToast } from '~/components/providers/ToastProvider';
import type { ProductCategoryType } from '~/server/db/schema';

type RouterOutput = inferRouterOutputs<AppRouter>;
type ProductListResponse = RouterOutput['product']['getAll'];
type ProductItem = NonNullable<ProductListResponse['items']>[number];

// Helper to convert nulls to undefined for optional server fields
const transformNullToUndefined = <T extends Record<string, any>>(
  data: T,
  // Keep category as potentially null initially, others become undefined
  keysToTransform: Exclude<keyof T, 'category'>[]
): {
  [K in keyof T]: K extends (typeof keysToTransform)[number]
    ? T[K] extends null
      ? undefined
      : T[K]
    : T[K];
} => {
  const transformed = { ...data };
  keysToTransform.forEach((key) => {
    if (transformed[key] === null) {
      transformed[key] = undefined as any; // Reverted to 'as any'
    }
  });
  return transformed as any; // Reverted to 'as any'
};

const ProductsPage: NextPageWithLayout = () => {
  const { t, formatCurrency } = useTranslation();
  const toast = useAppToast();
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const {
    isOpen: isCreateModalOpen,
    onOpen: onCreateModalOpen,
    onClose: onCreateModalClose,
  } = useDisclosure();
  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();
  const {
    isOpen: isViewModalOpen,
    onOpen: onViewModalOpen,
    onClose: onViewModalClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteDialogOpen,
    onOpen: onDeleteDialogOpen,
    onClose: onDeleteDialogClose,
  } = useDisclosure();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Query for products with pagination, search, and sort
  const { data, isLoading, refetch } = api.product.getAll.useQuery({
    page,
    limit: rowsPerPage,
    search: searchQuery,
  });

  // Convert data to Product type
  const products: ProductItem[] = data?.items
    ? data.items.map((product) => ({
        ...product,
        unitPrice:
          typeof product.unitPrice === 'string' ? product.unitPrice : String(product.unitPrice),
        // Ensure all required fields are present
        manufacturer: product.manufacturer ?? null,
        supplier: product.supplier ?? null,
        location: product.location ?? null,
        notes: product.notes ?? null,
      }))
    : [];

  // Get total products count
  const totalProducts = data?.total || products.length;

  // API mutations
  const utils = api.useUtils();

  const { mutate: createProduct, isPending: isCreating } = api.product.create.useMutation({
    onSuccess: () => {
      toast.success('Product created successfully');
      onCreateModalClose();
      void utils.product.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`Error creating product: ${error.message}`);
    },
  });

  const { mutate: updateProduct, isPending: isUpdating } = api.product.update.useMutation({
    onSuccess: () => {
      toast.success('Product updated successfully');
      onEditModalClose();
      void utils.product.getAll.invalidate();
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast.error(`Error updating product: ${error.message}`);
    },
  });

  const { mutate: deleteProduct, isPending: isDeleting } = api.product.delete.useMutation({
    onSuccess: () => {
      toast.success('Product deleted successfully');
      onDeleteDialogClose();
      void utils.product.getAll.invalidate();
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast.error(`Error deleting product: ${error.message}`);
    },
  });

  // Refetch data when sort or search parameters change
  useEffect(() => {
    refetch();
  }, [page, rowsPerPage, searchQuery, refetch]);

  // Open create product modal
  const handleCreateProduct = () => {
    setSelectedProduct(null);
    onCreateModalOpen();
  };

  // Open view product modal
  const handleViewProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    onViewModalOpen();
  };

  // Open edit product modal
  const handleEditProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    onEditModalOpen();
  };

  // Open delete product dialog
  const handleDeleteProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    onDeleteDialogOpen();
  };

  // Submit handlers
  const handleCreateSubmit = async (data: ProductSubmitData) => {
    if (!data.category) {
      toast.error(t('validation.selectOption', { field: t('productFields.category') }));
      return;
    }
    const { ...createData } = data;

    // Transform nulls to undefined for server compatibility
    const transformedData = transformNullToUndefined(createData, [
      'description',
      'sku',
      'manufacturer',
      'supplier',
      'location',
      'notes',
    ]) as Omit<typeof createData, 'category'> & {
      description?: string;
      sku?: string;
      manufacturer?: string;
      supplier?: string;
      location?: string;
      notes?: string;
    };

    createProduct({
      ...transformedData,
      category: createData.category as ProductCategoryType,
    });
  };

  const handleUpdateSubmit = async (data: ProductSubmitData) => {
    if (selectedProduct) {
      if (!data.category) {
        toast.error(t('validation.selectOption', { field: t('productFields.category') }));
        return;
      }
      const { ...updateData } = data;

      // Transform nulls to undefined for server compatibility
      const transformedData = transformNullToUndefined(updateData, [
        'description',
        'sku',
        'manufacturer',
        'supplier',
        'location',
        'notes',
      ]) as Omit<typeof updateData, 'category'> & {
        description?: string;
        sku?: string;
        manufacturer?: string;
        supplier?: string;
        location?: string;
        notes?: string;
      };

      updateProduct({
        id: selectedProduct.id,
        data: {
          ...transformedData,
          category: updateData.category as ProductCategoryType,
        },
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedProduct) {
      deleteProduct({ id: selectedProduct.id });
    }
  };

  // Render cell content based on column
  const renderCell = (product: ProductItem, columnKey: string) => {
    switch (columnKey) {
      case 'id':
        return `#${product.sequentialId}`;
      case 'name':
        return product.name;
      case 'category':
        return product.category ?? '-';
      case 'unitPrice':
        return formatCurrency(product.unitPrice);
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-1">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly variant="light" size="sm">
                  <MoreVertical size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label={t('products.actionsLabel')}>
                <DropdownItem
                  key="view"
                  startContent={<Eye size={16} />}
                  onPress={() => handleViewProduct(product)}
                >
                  {t('common.view')}
                </DropdownItem>
                <DropdownItem
                  key="edit"
                  startContent={<Edit size={16} />}
                  onPress={() => handleEditProduct(product)}
                >
                  {t('common.edit')}
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  startContent={<Trash size={16} />}
                  className="text-danger"
                  color="danger"
                  onPress={() => handleDeleteProduct(product)}
                >
                  {t('common.delete')}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default: {
        const value = product[columnKey as keyof ProductItem];
        return typeof value === 'object' ? JSON.stringify(value) : String(value || '-');
      }
    }
  };

  return (
    <>
      <Head>
        <title>{t('products.list.title')} | Construction Quote Manager</title>
      </Head>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        {/* Top Content */}
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Products</h1>
            <Button color="primary" startContent={<Plus size={16} />} onPress={handleCreateProduct}>
              New Product
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search size={16} className="text-default-300" />}
              className="w-full sm:max-w-[44%]"
            />
          </div>
        </div>

        {/* Table */}
        <Table
          aria-label="Products table"
          isHeaderSticky
          classNames={{
            wrapper: 'max-h-[calc(100vh-300px)]',
            table: 'min-h-[150px]',
          }}
        >
          <TableHeader>
            <TableColumn key="id" allowsSorting>
              {t('products.list.id')}
            </TableColumn>
            <TableColumn key="name" allowsSorting>
              {t('products.list.name')}
            </TableColumn>
            <TableColumn key="category">{t('products.list.category')}</TableColumn>
            <TableColumn key="unitPrice" allowsSorting>
              {t('products.list.price')}
            </TableColumn>
            <TableColumn key="actions" align="end">
              {t('common.actions')}
            </TableColumn>
          </TableHeader>
          <TableBody
            isLoading={isLoading}
            loadingContent={
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" color="primary" />
                <span className="ml-2">Loading products...</span>
              </div>
            }
            emptyContent={
              <div className="py-8 text-center">
                <p className="text-gray-500">No products found</p>
                <Button color="primary" className="mt-4" onPress={handleCreateProduct}>
                  Create your first product
                </Button>
              </div>
            }
            items={products}
          >
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey.toString())}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Bottom Content - Pagination */}
        <div className="mt-4 flex items-center justify-between px-2 py-4">
          <span className="text-default-400 text-sm">{`Total ${totalProducts} products`}</span>
          <Pagination
            isCompact
            showControls
            showShadow
            color="primary"
            page={page}
            total={Math.ceil(totalProducts / rowsPerPage)}
            onChange={setPage}
          />
          <div className="hidden w-[30%] justify-end gap-2 sm:flex">
            <Button isDisabled={page === 1} variant="flat" onPress={() => setPage(1)}>
              First
            </Button>
            <Button
              isDisabled={
                Math.ceil(totalProducts / rowsPerPage) <= 1 ||
                page === Math.ceil(totalProducts / rowsPerPage)
              }
              variant="flat"
              onPress={() => setPage(Math.ceil(totalProducts / rowsPerPage))}
            >
              Last
            </Button>
          </div>
        </div>
      </div>

      {/* Create Product Modal */}
      {isCreateModalOpen && (
        <ProductFormModal
          isOpen={isCreateModalOpen}
          onClose={onCreateModalClose}
          onSubmit={handleCreateSubmit}
          isSubmitting={isCreating}
        />
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && selectedProduct && (
        <ProductFormModal
          initialData={selectedProduct}
          isOpen={isEditModalOpen}
          onClose={onEditModalClose}
          onSubmit={handleUpdateSubmit}
          isSubmitting={isUpdating}
        />
      )}

      {/* View Product Modal */}
      {isViewModalOpen && selectedProduct && (
        <ProductFormModal
          initialData={selectedProduct}
          isOpen={isViewModalOpen}
          onClose={onViewModalClose}
          onSubmit={async () => {
            onViewModalClose();
          }}
          isReadOnly={true}
        />
      )}

      {/* Delete Product Dialog */}
      <DeleteEntityDialog
        isOpen={isDeleteDialogOpen}
        onClose={onDeleteDialogClose}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        entityName="Product"
        entityLabel={selectedProduct?.name || ''}
      />
    </>
  );
};

// Define the getLayout function
ProductsPage.getLayout = (page: React.ReactNode) => {
  return <MainLayout>{page}</MainLayout>;
};

export default ProductsPage;
