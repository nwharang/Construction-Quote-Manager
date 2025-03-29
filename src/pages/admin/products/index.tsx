import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Plus, Search, MoreVertical, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  Button,
  Input,
  Spinner,
  Pagination,
  Card,
  CardBody,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { api } from '~/utils/api';
import { type ProductCategory } from '~/server/db/schema';
import { useAppToast } from '~/components/providers/ToastProvider';
import type { RouterOutputs } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';

type Product = RouterOutputs['product']['getAll']['items'][number];
type ProductCategoryType = keyof typeof ProductCategory;

interface Column {
  name: string;
  uid: string;
}

const columns: Column[] = [
  { name: 'PRODUCT', uid: 'product' },
  { name: 'CATEGORY', uid: 'category' },
  { name: 'PRICE', uid: 'price' },
  { name: 'ACTIONS', uid: 'actions' },
];

const categoryColorMap: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  'MATERIAL': 'primary',
  'TOOL': 'success',
  'SERVICE': 'warning',
  'OTHER': 'default',
};

const ProductLoadingError = ({ 
  error, 
  onRetry 
}: { 
  error: unknown; 
  onRetry: () => void;
}) => {
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
      ? error 
      : 'Failed to load products';
      
  const isNetworkError = errorMessage.includes('Failed to fetch') || 
                         errorMessage.includes('network');
  
  return (
    <Card className="w-full bg-danger-50">
      <CardBody>
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <AlertTriangle size={48} className="text-danger" />
          <h2 className="text-xl font-semibold">Error Loading Products</h2>
          <p className="text-gray-600">
            {isNetworkError 
              ? 'Network error. Please check your internet connection.' 
              : errorMessage}
          </p>
          <Button 
            color="primary" 
            startContent={<RefreshCw className="h-4 w-4" />}
            onClick={onRetry}
          >
            Retry
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

const ProductsPage: NextPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const selectedCategory: ProductCategoryType | 'ALL' = 'ALL';
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const toast = useAppToast();
  const { formatCurrency } = useTranslation();

  const { data: products, isLoading, error, refetch } = api.product.getAll.useQuery(
    {
      search: searchQuery,
      category: selectedCategory === 'ALL' ? undefined : selectedCategory,
      page,
      limit: rowsPerPage,
    },
    {
      enabled: status === 'authenticated',
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnMount: true
    }
  );

  // Handle error with useEffect
  useEffect(() => {
    if (error) {
      toast.error(`Failed to load products: ${error.message}`);
    }
  }, [error, toast]);

  const deleteMutation = api.product.delete.useMutation({
    onSuccess: () => {
      toast.success('Product deleted successfully');
      void refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteMutation.mutateAsync({ id });
      } catch (err) {
        // Error is handled in onError callback
      }
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(1);
  };

  const renderCell = (product: Product, columnKey: string, index: number) => {
    // Calculate product number based on pagination
    const productNumber = (page - 1) * rowsPerPage + index + 1;
    
    switch (columnKey) {
      case 'product':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize text-foreground">{product.name}</p>
            <p className="text-bold text-tiny capitalize text-muted-foreground">
              #{product.sequentialId} <span className="text-xs text-muted-foreground/50">({product.id.substring(0, 8)}...)</span>
            </p>
          </div>
        );
      case 'category':
        return (
          <Chip
            className="capitalize"
            color={categoryColorMap[product.category] || 'default'}
            size="sm"
            variant="flat"
          >
            {product.category.toLowerCase()}
          </Chip>
        );
      case 'price':
        return formatCurrency(Number(product.unitPrice));
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="flat"
              color="primary"
              onPress={() => router.push(`/admin/products/${product.id}`)}
              isDisabled={deleteMutation.isPending}
            >
              View
            </Button>
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light" isDisabled={deleteMutation.isPending}>
                  <MoreVertical className="text-default-500" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Product actions">
                <DropdownItem
                  key="edit"
                  onPress={() => router.push(`/admin/products/${product.id}/edit`)}
                >
                  Edit
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  onPress={() => handleDelete(product.id)}
                  isDisabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    'Delete'
                  )}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return null;
    }
  };

  if (status === 'loading') {
    return (
      <>
        <Head>
          <title>Products - Admin Dashboard</title>
        </Head>
        <div className="container mx-auto py-8">
          <div className="flex justify-center items-center min-h-[50vh]">
            <Spinner size="lg" color="primary" />
          </div>
        </div>
      </>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Error state
  if (error) {
    return (
      <>
        <Head>
          <title>Products - Admin Dashboard</title>
        </Head>
        <div className="container mx-auto py-8">
          <ProductLoadingError error={error} onRetry={() => void refetch()} />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Products - Admin Dashboard</title>
      </Head>

      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Products</h1>
              <p className="text-gray-600">Manage your product catalog</p>
            </div>
            <Button
              color="primary"
              startContent={<Plus size={20} />}
              onPress={() => router.push('/admin/products/new')}
            >
              New Product
            </Button>
          </div>

          <div className="flex justify-between items-center gap-3">
            <Input
              isClearable
              className="w-full sm:max-w-[44%]"
              placeholder="Search products..."
              startContent={<Search size={18} />}
              value={searchQuery}
              onValueChange={handleSearch}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center my-12">
              <Spinner size="lg" />
            </div>
          ) : products?.items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No products found</p>
              <Button 
                color="primary" 
                className="mt-4"
                onPress={() => router.push('/admin/products/new')}
              >
                Add Your First Product
              </Button>
            </div>
          ) : (
            <Table aria-label="Products table">
              <TableHeader>
                {columns.map((column) => (
                  <TableColumn key={column.uid}>{column.name}</TableColumn>
                ))}
              </TableHeader>
              <TableBody>
                {products?.items.map((product, index) => (
                  <TableRow key={product.id}>
                    {columns.map((column) => (
                      <TableCell key={column.uid}>
                        {renderCell(product, column.uid, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                )) || []}
              </TableBody>
            </Table>
          )}

          {products && products.items.length > 0 && (
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Products per page:</span>
                  <Select
                    aria-label="Products per page"
                    selectedKeys={[rowsPerPage.toString()]}
                    onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                    className="w-24 min-w-0"
                    size="sm"
                  >
                    {[5, 10, 15, 20].map((value) => (
                      <SelectItem key={value.toString()} textValue={value.toString()}>
                        {value}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {products.total} items
                  </span>
                </div>
              </div>
              <div className="flex justify-center">
                <Pagination
                  total={products.totalPages}
                  page={page}
                  onChange={handlePageChange}
                  showControls
                  color="primary"
                  classNames={{
                    wrapper: "gap-2",
                    item: "w-8 h-8",
                    cursor: "bg-primary",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductsPage;
