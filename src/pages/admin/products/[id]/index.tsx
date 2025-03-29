import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Edit, Package, Tag, DollarSign, FileText } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Chip,
  Divider,
} from '@heroui/react';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { useAppToast } from '~/components/providers/ToastProvider';

// Map for product category colors
const categoryColorMap: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  'MATERIAL': 'primary',
  'TOOL': 'success',
  'SERVICE': 'warning',
  'OTHER': 'default',
};

export default function ProductDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: authStatus } = useSession();
  const { formatCurrency } = useTranslation();
  const toast = useAppToast();

  // Fetch product data
  const { data: product, isLoading: isLoadingProduct } = api.product.getById.useQuery(
    { id: id as string },
    { enabled: !!id && authStatus === 'authenticated' }
  );

  // Handle delete product
  const deleteMutation = api.product.delete.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh the UI
      const utils = api.useContext();
      utils.product.getAll.invalidate();
      
      toast.success('Product deleted successfully');
      router.push('/admin/products');
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteMutation.mutateAsync({ id: id as string });
      } catch (err) {
        // Error is handled in onError callback
      }
    }
  };

  // Not authenticated
  if (authStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Loading product data
  if (isLoadingProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  // Product not found
  if (!product) {
    return (
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-2xl font-bold text-foreground mb-2">Product Not Found</h1>
          <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
          <Button
            color="primary"
            className="mt-4"
            onPress={() => router.push('/admin/products')}
          >
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{product.name} | Product Details</title>
      </Head>

      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                variant="light"
                onPress={() => router.back()}
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
                <div className="flex items-center gap-2">
                  <Chip
                    className="capitalize"
                    color={categoryColorMap[product.category] || 'default'}
                    size="sm"
                    variant="flat"
                  >
                    {product.category.toLowerCase()}
                  </Chip>
                  <span className="text-tiny text-muted-foreground">Product #{product.sequentialId}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                color="primary"
                variant="bordered"
                onPress={() => router.push(`/admin/products/${product.id}/edit`)}
              >
                Edit
              </Button>
              <Button
                color="danger"
                variant="bordered"
                onPress={handleDelete}
                isDisabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">Product Details</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Product Name</p>
                      <p className="text-foreground font-medium">{product.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="text-foreground font-medium capitalize">{product.category.toLowerCase()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Unit Price</p>
                      <p className="text-foreground font-medium">{formatCurrency(Number(product.unitPrice))}</p>
                    </div>
                  </div>
                </div>

                {product.description && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="text-foreground">{product.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">Usage</h2>
            </CardHeader>
            <CardBody>
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  Product usage tracking coming soon
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This section will show quotes where this product has been used
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
} 