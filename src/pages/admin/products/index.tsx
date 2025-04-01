import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
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
import { Plus, Search, MoreVertical, Edit, Trash, Eye } from 'lucide-react';
import { api } from '~/utils/api';
import { useEntityStore, useToastStore } from '~/store';
import { formatCurrency } from '~/utils/currency';
import { formatUserFriendlyId } from '~/utils/formatters';
import { MainLayout } from '~/layouts';
import type { NextPageWithLayout } from '~/types/next';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';
import { ProductFormModal } from '~/components/products/ProductFormModal';
import { DeleteEntityDialog } from '~/components/shared/DeleteEntityDialog';

type RouterOutput = inferRouterOutputs<AppRouter>;
type ProductListResponse = RouterOutput['product']['getAll'];
type ProductItem = NonNullable<ProductListResponse['items']>[number];

// API product type may have unitPrice as string
interface ApiProduct extends Omit<ProductItem, 'unitPrice'> {
  unitPrice: string | number;
}

const ProductsPage: NextPageWithLayout = () => {
  const toast = useToastStore();
  const entityStore = useEntityStore();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState<'ascending' | 'descending'>('ascending');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Set global entity settings for the EntityList component
  useEffect(() => {
    entityStore.setEntitySettings({
      entityName: 'Products',
      entityType: 'products',
      baseUrl: '/admin/products',
      displayNameField: 'name',
      canView: true,
      canEdit: true,
      canDelete: true,
      listPath: '/admin/products',
      createPath: '/admin/products/new',
      editPath: '/admin/products/:id/edit',
      viewPath: '/admin/products/:id',
    });

    // Clean up
    return () => entityStore.resetEntitySettings();
  }, []);

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
        unitPrice: typeof product.unitPrice === 'string' ? product.unitPrice : String(product.unitPrice),
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
      utils.product.getAll.invalidate();
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      toast.error(`Error creating product: ${error.message}`);
    }
  });

  const { mutate: updateProduct, isPending: isUpdating } = api.product.update.useMutation({
    onSuccess: () => {
      toast.success('Product updated successfully');
      utils.product.getAll.invalidate();
      setIsEditModalOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast.error(`Error updating product: ${error.message}`);
    }
  });

  const { mutate: deleteProduct, isPending: isDeleting } = api.product.delete.useMutation({
    onSuccess: () => {
      toast.success('Product deleted successfully');
      utils.product.getAll.invalidate();
      setIsDeleteDialogOpen(false);
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

  // Open create product modal
  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setIsCreateModalOpen(true);
  };

  // Open view product modal
  const handleViewProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  // Open edit product modal
  const handleEditProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  // Open delete product dialog
  const handleDeleteProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Submit handlers
  const handleCreateSubmit = async (data: any) => {
    await createProduct(data);
  };

  const handleUpdateSubmit = async (data: any) => {
    if (selectedProduct) {
      await updateProduct({
        id: selectedProduct.id,
        ...data,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedProduct) {
      await deleteProduct({ id: selectedProduct.id });
    }
  };

  // Render cell content based on column
  const renderCell = (product: ProductItem, columnKey: string) => {
    switch (columnKey) {
      case 'id':
        return (
          <span className="font-mono text-xs">
            {formatUserFriendlyId(product.id, product.sequentialId)}
          </span>
        );
      case 'name':
        return (
          <div className="flex flex-col">
            <span className="font-medium">{product.name}</span>
            {product.description && (
              <span className="text-default-500 line-clamp-1 text-xs">{product.description}</span>
            )}
          </div>
        );
      case 'category':
        return <span>{product.category}</span>;
      case 'unitPrice':
        return <span className="font-medium">{formatCurrency(product.unitPrice)}</span>;
      case 'actions':
        return (
          <div className="flex items-center justify-end">
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
                  onPress={() => handleViewProduct(product)}
                >
                  View
                </DropdownItem>
                <DropdownItem
                  key="edit"
                  startContent={<Edit size={16} />}
                  onPress={() => handleEditProduct(product)}
                >
                  Edit
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  startContent={<Trash size={16} />}
                  className="text-danger"
                  color="danger"
                  onPress={() => handleDeleteProduct(product)}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        const value = product[columnKey as keyof ProductItem];
        return typeof value === 'object' ? JSON.stringify(value) : String(value || '');
    }
  };

  return (
    <>
      <Head>
        <title>Products | Construction Quote Manager</title>
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
            <TableColumn key="id" allowsSorting onClick={() => handleSortChange('id')}>
              ID
            </TableColumn>
            <TableColumn key="name" allowsSorting onClick={() => handleSortChange('name')}>
              Name
            </TableColumn>
            <TableColumn key="category">Category</TableColumn>
            <TableColumn
              key="unitPrice"
              allowsSorting
              onClick={() => handleSortChange('unitPrice')}
            >
              Unit Price
            </TableColumn>
            <TableColumn key="actions" align="end">
              Actions
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
      <ProductFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={isCreating}
      />

      {/* Edit Product Modal */}
      <ProductFormModal
        product={selectedProduct || undefined}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateSubmit}
        isLoading={isUpdating}
      />

      {/* View Product Modal */}
      <ProductFormModal
        product={selectedProduct || undefined}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        onSubmit={() => Promise.resolve()}
        isLoading={false}
        readOnly={true}
      />

      {/* Delete Product Dialog */}
      <DeleteEntityDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        entityName="Product"
        entityLabel={selectedProduct?.name || ""}
      />
    </>
  );
};

// Define the getLayout function
ProductsPage.getLayout = (page: React.ReactNode) => {
  return <MainLayout>{page}</MainLayout>;
};

export default ProductsPage;
