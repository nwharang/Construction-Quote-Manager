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
  Tag,
  Package,
  CircleDollarSign,
  MoreVertical,
  Eye,
  Edit,
  Trash,
  FileText,
  MapPin,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '~/store/uiStore';
import { ListToolbar } from '~/components/shared/ListToolbar';

// Use inferred type from the API output for the list items
type ProductListItem = RouterOutputs['product']['getAll']['data'][number];

export function ProductsList() {
  const { t, formatDate, formatCurrency } = useTranslation();
  const toast = useAppToast();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [productToDelete, setProductToDelete] = useState<ProductListItem | null>(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [viewType, setViewType] = useState<'card' | 'table'>('card'); // Default to card view

  // Use UI settings from the store
  const { tableSettings, buttonSettings } = useUIStore();

  const pageSize = 10;

  // API Utils for invalidation
  const utils = api.useUtils();

  // Get products data with search and pagination
  const { data: productsData, isLoading } = api.product.getAll.useQuery({
    page,
    pageSize,
    filter: search,
  });

  // --- Delete Mutation ---
  const { mutate: deleteProduct, isPending: isDeleting } = api.product.delete.useMutation({
    onSuccess: () => {
      utils.product.getAll.invalidate(); // Invalidate list query
      toast.success(t('products.deleteSuccess'));
      onDeleteClose();
      setProductToDelete(null);
    },
    onError: (error) => {
      toast.error(t('products.deleteError', { message: error.message }));
      onDeleteClose();
      setProductToDelete(null);
    },
  });

  // --- Action Handlers ---
  const handleCreateProduct = useCallback(() => {
    router.push('/admin/products/new');
  }, [router]);

  const handleView = useCallback(
    (product: ProductListItem) => {
      router.push(`/admin/products/${product.id}/view`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (product: ProductListItem) => {
      router.push(`/admin/products/${product.id}/edit`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback(
    (product: ProductListItem) => {
      setProductToDelete(product);
      onDeleteOpen();
    },
    [onDeleteOpen]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (productToDelete) {
      try {
        await deleteProduct({ id: productToDelete.id });
      } catch (error) {
        // Error handled by onError mutation handler
        console.error('Delete product failed:', error);
      }
    }
  }, [deleteProduct, productToDelete]);

  // Column definitions
  const columns = useMemo(
    () => [
      { uid: 'name', name: t('products.list.name') },
      { uid: 'category', name: t('products.list.category'), hideOnMobile: true },
      { uid: 'unitPrice', name: t('products.list.price'), hideOnMobile: false },
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
    (product: ProductListItem, columnKey: React.Key) => {
      switch (columnKey) {
        case 'name':
          return (
            <div className="flex flex-col">
              <p className="text-foreground font-medium">{product.name}</p>
              {product.description && (
                <p className="text-default-500 max-w-[200px] truncate text-xs">
                  {product.description}
                </p>
              )}
            </div>
          );
        case 'category':
          return product.category?.name || '-';
        case 'unitPrice':
          return formatCurrency(Number(product.unitPrice));
        case 'createdAt':
          return product.createdAt ? formatDate(product.createdAt, 'short') : '-';
        case 'actions':
          return (
            <div className="flex justify-end">
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="light" size="sm">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Product actions">
                  <DropdownItem
                    key="view"
                    startContent={<Eye size={16} />}
                    onPress={() => handleView(product)}
                  >
                    {t('common.view')}
                  </DropdownItem>
                  <DropdownItem
                    key="edit"
                    startContent={<Edit size={16} />}
                    onPress={() => handleEdit(product)}
                  >
                    {t('common.edit')}
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    startContent={<Trash size={16} />}
                    className="text-danger"
                    color="danger"
                    onPress={() => handleDeleteRequest(product)}
                  >
                    {t('common.delete')}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return String(product[columnKey as keyof ProductListItem] || '-');
      }
    },
    [handleView, handleEdit, handleDeleteRequest, t, formatDate, formatCurrency]
  );

  // Render the card view for a product
  const renderProductCard = useCallback(
    (product: ProductListItem) => (
      <Card
        key={product.id}
        shadow="sm"
        radius="lg"
        isHoverable
        className="overflow-hidden"
        as="div" // Force it to render as a div instead of a button
      >
        {/* Card Header */}
        <div 
          className="flex flex-col cursor-pointer" 
          onClick={() => handleView(product)}
        >
          <CardHeader className="flex flex-col items-start p-4 pb-3">
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-default-400 mt-1 text-[11px]">
              {product.createdAt ? formatDate(product.createdAt, 'short') : '-'}
            </p>
          </CardHeader>

          <Divider className="opacity-50" />

          <CardBody className="p-4">
            <div className="flex flex-col gap-4">
              {/* Category field */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full">
                  <Tag size={14} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-default-400 text-xs">{t('productFields.category')}</p>
                  <p className="text-sm">{product.category?.name || '-'}</p>
                </div>
              </div>

              {/* Price field */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full">
                  <CircleDollarSign size={14} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-default-400 text-xs">{t('productFields.unitPrice')}</p>
                  <p className="text-sm font-medium">{formatCurrency(Number(product.unitPrice))}</p>
                </div>
              </div>

              {/* Unit/SKU field */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full">
                  <Package size={14} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-default-400 text-xs">{t('productFields.unit')}</p>
                  <p className="text-sm">{product.unit || '-'}</p>
                </div>
              </div>

              {/* Location field */}
              {product.location && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full">
                    <MapPin size={14} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-default-400 text-xs">{t('productFields.location')}</p>
                    <p className="text-sm">{product.location}</p>
                  </div>
                </div>
              )}
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
            onPress={() => handleView(product)}
            className="flex-1"
          >
            {t('common.view')}
          </Button>
          <Button
            size="sm"
            color="default"
            variant="flat"
            startContent={<Edit size={16} />}
            onPress={() => handleEdit(product)}
            className="flex-1"
          >
            {t('common.edit')}
          </Button>
          <Button
            size="sm"
            color="danger"
            variant="flat"
            startContent={<Trash size={16} />}
            onPress={() => handleDeleteRequest(product)}
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
        <p className="text-default-500 mb-4 text-lg">{t('products.noProductsFound')}</p>
        <Button color="primary" startContent={<Plus size={16} />} onPress={handleCreateProduct}>
          {t('common.new')}
        </Button>
      </div>
    ),
    [t, handleCreateProduct]
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
        onCreateClick={handleCreateProduct}
        createButtonLabel={t('common.create')}
        searchPlaceholder={t('products.searchPlaceholder')}
      />
      
      <Card className="w-full">
        <CardBody className="px-2 sm:px-4">
          {isLoading ? (
            renderLoadingState()
          ) : (productsData?.data?.length ?? 0) === 0 ? (
            renderEmptyState()
          ) : viewType === 'card' ? (
            // Card View - Reduce to single column on smallest screens
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productsData?.data.map(renderProductCard)}
            </div>
          ) : (
            // Table View - responsive with horizontal scroll on small screens
            <div className="-mx-2 sm:-mx-4 overflow-x-auto">
              <Table
                aria-label="Products table"
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
                <TableBody items={productsData?.data ?? []} emptyContent={t('common.noResults')}>
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
          {(productsData?.totalCount ?? 0) > pageSize && (
            <div className="mt-4 sm:mt-6 flex justify-center">
              <Pagination
                page={page}
                total={Math.ceil((productsData?.totalCount ?? 0) / pageSize)}
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
          entityName={t('products.entityName')}
          entityLabel={productToDelete?.name ?? ''}
        />
      </Card>
    </div>
  );
}
