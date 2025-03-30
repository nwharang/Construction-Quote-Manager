import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Button, 
  Spinner, 
  Badge, 
  Chip 
} from '@heroui/react';
import { Edit, ArrowLeft, Trash2 } from 'lucide-react';
import { api } from '~/utils/api';
import { Layout } from '~/components/Layout';
import { formatCurrency } from '~/utils/currency';
import { formatDate, formatUserFriendlyId } from '~/utils/formatters';
import { useAppToast } from '~/components/providers/ToastProvider';

export default function ProductDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const toast = useAppToast();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const utils = api.useUtils();

  // Get product details
  const { data: product, isLoading, error } = api.product.getById.useQuery(
    { id: id as string },
    { enabled: !!id }
  );

  // Delete mutation
  const deleteProductMutation = api.product.delete.useMutation({
    onSuccess: () => {
      toast.success('Product deleted successfully');
      router.push('/admin/products');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete product');
    }
  });

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProductMutation.mutateAsync({ id: id as string });
    }
  };

  const handleEdit = () => {
    router.push(`/admin/products/${id}/edit`);
  };

  const handleBackToList = () => {
    router.push('/admin/products');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" color="primary" />
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-2xl font-bold text-danger">Error Loading Product</h2>
          <p className="text-muted-foreground mb-4">{error?.message || 'Product not found'}</p>
          <Button color="primary" onPress={handleBackToList}>Back to Products</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{product.name} | Product Details</title>
      </Head>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="light" 
              startContent={<ArrowLeft size={16} />}
              onPress={handleBackToList}
            >
              Back to Products
            </Button>
            <h1 className="text-2xl font-bold">{product.name}</h1>
          </div>
          
          <div className="flex gap-2">
            <Button 
              color="primary" 
              variant="flat" 
              startContent={<Edit size={16} />}
              onPress={handleEdit}
            >
              Edit
            </Button>
            <Button 
              color="danger" 
              variant="flat" 
              startContent={<Trash2 size={16} />}
              onPress={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-semibold">Product Details</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">ID</span>
                  <span>{formatUserFriendlyId(product.id, product.sequentialId || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{product.name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Category</span>
                  <Badge color="primary" variant="flat">{product.category}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Unit Price</span>
                  <span className="font-bold">{formatCurrency(product.unitPrice)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Unit</span>
                  <span>{product.unit}</span>
                </div>
                
                {product.description && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Usage Statistics</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Created</span>
                    <span>{formatDate(product.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{formatDate(product.updatedAt)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Actions</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <Button 
                    color="primary" 
                    className="w-full"
                    onPress={handleEdit}
                  >
                    Edit Product
                  </Button>
                  <Button 
                    color="danger" 
                    variant="flat" 
                    className="w-full"
                    onPress={handleDelete}
                  >
                    Delete Product
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
} 