import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Plus, MoreVertical, Search, AlertTriangle } from 'lucide-react';
import {
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Chip,
  Card,
  CardBody,
} from '@heroui/react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { api } from '~/utils/api';
import { type ProductCategory } from '~/server/db/schema';
import { useAppToast } from '~/components/providers/ToastProvider';
import type { RouterOutputs } from '~/utils/api';

type Product = RouterOutputs['product']['getAll']['items'][number];
type ProductCategoryType = keyof typeof ProductCategory;

interface Column {
  name: string;
  uid: string;
}

const columns: Column[] = [
  { name: "NAME", uid: "name" },
  { name: "CATEGORY", uid: "category" },
  { name: "UNIT PRICE", uid: "unitPrice" },
  { name: "ACTIONS", uid: "actions" },
];

// Helper to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const ProductsPage: NextPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const selectedCategory: ProductCategoryType | 'ALL' = 'ALL';
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const toast = useAppToast();

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
    if (window.confirm('Are you sure you want to delete this product?')) {
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
          <Card className="bg-danger-50">
            <CardBody>
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <AlertTriangle size={48} className="text-danger" />
                <h2 className="text-xl font-semibold">Error Loading Products</h2>
                <p className="text-gray-600">{error.message}</p>
                <Button color="primary" onClick={() => void refetch()}>Retry</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  const renderCell = (product: Product, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{product.name}</p>
            <p className="text-bold text-tiny capitalize text-gray-500">#{product.id}</p>
          </div>
        );
      case "category":
        return (
          <Chip
            className="capitalize"
            color="primary"
            size="sm"
            variant="flat"
          >
            {product.category.toLowerCase()}
          </Chip>
        );
      case "unitPrice":
        return formatCurrency(Number(product.unitPrice));
      case "actions":
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="light">
                <MoreVertical size={20} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem key="edit" onPress={() => router.push(`/admin/products/${product.id}/edit`)}>
                Edit
              </DropdownItem>
              <DropdownItem key="delete" className="text-danger" onPress={() => handleDelete(product.id)}>
                Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return null;
    }
  };

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

          <Table
            aria-label="Products table"
            classNames={{
              wrapper: "max-h-[600px]",
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={products?.items ?? []}
              emptyContent="No products found"
              isLoading={isLoading}
              loadingContent={<Spinner />}
            >
              {(product) => (
                <TableRow key={product.id}>
                  {(columnKey) => (
                    <TableCell>{renderCell(product, String(columnKey))}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>

          {products && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rows per page:</span>
                  <select
                    className="text-sm border rounded-md px-2 py-1"
                    value={rowsPerPage}
                    onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                  >
                    {[10, 20, 30, 40, 50].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
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
