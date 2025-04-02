import React, { useState, useEffect, useCallback } from 'react';
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

const ProductsPage: NextPageWithLayout = () => {
  const { t, formatCurrency } = useTranslation();
  const toast = useAppToast();
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // --- Define useDisclosure hooks FIRST ---
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  // --- End useDisclosure hooks ---

  // Query for products list
  const { data, isLoading: isListLoading, refetch } = api.product.getAll.useQuery({
    page,
    limit: rowsPerPage,
    search: searchQuery,
  });

  // Format products data
  const products: ProductItem[] = data?.items
    ? data.items.map((product) => ({
        ...product,
        unitPrice:
          typeof product.unitPrice === 'string' ? product.unitPrice : String(product.unitPrice),
        manufacturer: product.manufacturer ?? null,
        supplier: product.supplier ?? null,
        location: product.location ?? null,
        notes: product.notes ?? null,
      }))
    : [];
  const totalProducts = data?.total || products.length;

  // API Utils
  const utils = api.useUtils();

  // Fetch data for View Modal
  const productDataForViewQuery = api.product.getById.useQuery(
    { id: selectedProduct?.id || '' },
    {
      enabled: !!selectedProduct?.id && isViewOpen,
      refetchOnWindowFocus: false,
    }
  );

  // --- Define Mutations AFTER useDisclosure hooks ---
  const { mutate: createProduct, isPending: isCreating } = api.product.create.useMutation({
    onSuccess: () => {
      toast.success(t('products.createSuccess'));
      onCreateClose(); // Use specific close hook
      void utils.product.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`${t('products.createError')}: ${error.message}`);
    },
  });

  const { mutate: updateProduct, isPending: isUpdating } = api.product.update.useMutation({
    onSuccess: () => {
      toast.success(t('products.updateSuccess'));
      onEditClose(); // Use specific close hook
      void utils.product.getAll.invalidate();
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast.error(`${t('products.updateError')}: ${error.message}`);
    },
  });

  const { mutate: deleteProduct, isPending: isDeleting } = api.product.delete.useMutation({
    onSuccess: () => {
      toast.success(t('products.deleteSuccess'));
      onDeleteClose(); // Use specific close hook
      void utils.product.getAll.invalidate();
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast.error(`${t('products.deleteError')}: ${error.message}`);
    },
  });
  // --- End Mutations ---

  // Refetch list data when parameters change
  useEffect(() => {
    refetch();
  }, [page, rowsPerPage, searchQuery, refetch]);

  // === START: Define Modal Handlers ===
  const handleCreate = useCallback(() => {
    setSelectedProduct(null);
    onCreateOpen();
  }, [onCreateOpen]);

  const handleEdit = useCallback((product: ProductItem) => {
    setSelectedProduct(product);
    onEditOpen();
  }, [onEditOpen]);

  const handleView = useCallback((product: ProductItem) => {
    setSelectedProduct(product);
    onViewOpen();
  }, [onViewOpen]);

  const handleDeleteRequest = useCallback((product: ProductItem) => {
    setSelectedProduct(product);
    onDeleteOpen();
  }, [onDeleteOpen]);
  // === END: Define Modal Handlers ===

  // === START: Define Submit Handlers ===
  const handleCreateSubmit = useCallback(async (data: ProductSubmitData) => {
    if (!data.category) {
      toast.error(t('validation.selectOption', { field: t('productFields.category') }));
      return;
    }
    try {
        await createProduct({
            name: data.name,
            description: data.description ?? undefined,
            sku: data.sku ?? undefined,
            unitPrice: data.unitPrice,
            unit: data.unit ?? undefined, // Ensure unit is passed
            manufacturer: data.manufacturer ?? undefined,
            supplier: data.supplier ?? undefined,
            location: data.location ?? undefined,
            notes: data.notes ?? undefined,
            category: data.category as ProductCategoryType,
        });
    } catch (error) {
        console.error("Create product failed:", error);
        // Error toast is handled by mutation onError
    }
  }, [createProduct, t, toast]);

  const handleUpdateSubmit = useCallback(async (data: ProductSubmitData) => {
    if (selectedProduct) {
      if (!data.category) {
        toast.error(t('validation.selectOption', { field: t('productFields.category') }));
        return;
      }
      try {
          await updateProduct({
            id: selectedProduct.id,
            data: {
              name: data.name,
              description: data.description ?? undefined,
              sku: data.sku ?? undefined,
              unitPrice: data.unitPrice,
              unit: data.unit ?? undefined, // Ensure unit is passed
              manufacturer: data.manufacturer ?? undefined,
              supplier: data.supplier ?? undefined,
              location: data.location ?? undefined,
              notes: data.notes ?? undefined,
              category: data.category as ProductCategoryType,
            },
          });
      } catch (error) {
          console.error("Update product failed:", error);
          // Error toast is handled by mutation onError
      }
    }
  }, [updateProduct, selectedProduct, t, toast]);

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedProduct) {
        try {
            await deleteProduct({ id: selectedProduct.id });
        } catch (error) {
            console.error("Delete product failed:", error);
             // Error toast is handled by mutation onError
        }
    }
  }, [deleteProduct, selectedProduct]);
  // === END: Define Submit Handlers ===

  // Render cell content based on column
  const renderCell = (product: ProductItem, columnKey: string) => {
    switch (columnKey) {
      case 'sequentialId': // Use sequentialId for display
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
                  onPress={() => handleView(product)} // Use correct handler
                >
                  {t('common.view')}
                </DropdownItem>
                <DropdownItem
                  key="edit"
                  startContent={<Edit size={16} />}
                  onPress={() => handleEdit(product)} // Use correct handler
                >
                  {t('common.edit')}
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  startContent={<Trash size={16} />}
                  className="text-danger"
                  color="danger"
                  onPress={() => handleDeleteRequest(product)} // Use correct handler
                >
                  {t('common.delete')}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        // Handle potential non-string values gracefully
        const value = product[columnKey as keyof ProductItem];
        return typeof value === 'number' || typeof value === 'string' ? String(value) : '-';
    }
  };

  // Determine which product data to pass to the modal
  const productForModal = isViewOpen
     ? productDataForViewQuery.data as ProductItem | undefined
     : (isCreateOpen ? undefined : selectedProduct ?? undefined);

  return (
    <>
      <Head>
        <title>{t('products.title')}</title>
      </Head>

      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        {/* Top Bar: Title, Search, Create Button */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold">{t('products.title')}</h1>
          <div className="flex w-full gap-3 sm:w-auto">
            <Input
              isClearable
              placeholder={t('products.searchPlaceholder')}
              startContent={<Search size={16} />}
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="w-full sm:max-w-xs"
            />
            <Button
              color="primary"
              startContent={<Plus size={16} />}
              onPress={handleCreate} // Use correct handler
            >
              {t('products.new')}
            </Button>
          </div>
        </div>

        {/* Table */}
        {isListLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table aria-label={t('products.tableLabel')}>
            <TableHeader>
              <TableColumn key="sequentialId">{t('products.list.id')}</TableColumn>
              <TableColumn key="name">{t('products.list.name')}</TableColumn>
              <TableColumn key="category">{t('products.list.category')}</TableColumn>
              <TableColumn key="unitPrice">{t('products.list.price')}</TableColumn>
              <TableColumn key="actions" className="text-right">{t('common.actions')}</TableColumn>
            </TableHeader>
            <TableBody items={products} emptyContent={t('products.noProductsFound')}>
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => (
                    <TableCell>{renderCell(item, columnKey as string)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {!isListLoading && totalProducts > rowsPerPage && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              isCompact
              showControls
              showShadow
              color="primary"
              page={page}
              total={Math.ceil(totalProducts / rowsPerPage)}
              onChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Product Form Modal (Handles Create/Edit/View) */}
      <ProductFormModal
        initialData={productForModal} // Pass the correct data
        isOpen={isCreateOpen || isEditOpen || isViewOpen} // Combine open states
        onClose={isEditOpen ? onEditClose : (isViewOpen ? onViewClose : onCreateClose)} // Correct close handler
        onSubmit={isEditOpen ? handleUpdateSubmit : handleCreateSubmit} // Correct submit handler
        // Pass the loading state using the expected 'isSubmitting' prop
        isSubmitting={isEditOpen ? isUpdating : (isViewOpen ? productDataForViewQuery.isLoading : isCreating)}
        isReadOnly={isViewOpen} // Set read-only for view mode
      />

      {/* Delete Product Dialog */}
      <DeleteEntityDialog
        isOpen={isDeleteOpen} // Use specific open state
        onClose={onDeleteClose} // Use specific close handler
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting} // Use specific loading state
        entityName={t('products.entityName')}
        entityLabel={selectedProduct?.name || ''}
      />
    </>
  );
};

ProductsPage.getLayout = (page) => {
  return <MainLayout>{page}</MainLayout>;
};

export default ProductsPage;
