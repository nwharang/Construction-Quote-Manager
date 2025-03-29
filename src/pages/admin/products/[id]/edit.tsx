import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '~/utils/api';
import { Button, Card, CardBody, Input, Textarea, Spinner, useToast } from '@heroui/react';
import { ProductCategory } from '~/server/db/schema';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '0.00',
    sku: '',
    stock: '0',
  });

  // Fetch product data using tRPC
  const { data: product, isLoading: isLoadingProduct } = api.product.getById.useQuery(
    { id: id as string },
    { enabled: !!id && status === 'authenticated' }
  );

  // Update mutation
  const updateProductMutation = api.product.update.useMutation({
    onSuccess: () => {
      toast.success('Product updated successfully');
      router.push('/admin/products');
    },
    onError: (error) => {
      toast.error(`Error updating product: ${error.message}`);
    },
  });

  // Set initial form data when product is loaded
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.unitPrice.toString(),
        sku: product.sku || '',
        stock: product.unitPrice.toString(),
      });
    }
  }, [product]);

  // Loading state
  if (status === 'loading' || isLoadingProduct) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Error state
  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-danger mb-4">Product not found</h1>
          <Button color="primary" variant="light" onClick={() => router.push('/admin/products')}>
            Return to products list
          </Button>
        </div>
      </div>
    );
  }

  // Helper to format currency input
  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(/[^\d.]/g, ''));
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'price') {
      setFormData({
        ...formData,
        [name]: formatCurrency(value),
      });
    } else if (name === 'stock') {
      setFormData({
        ...formData,
        [name]: value.replace(/[^\d]/g, ''),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    updateProductMutation.mutate({
      id: id as string,
      data: {
        name: formData.name,
        description: formData.description,
        category: ProductCategory.OTHER, // Default category
        unitPrice: parseFloat(formData.price),
        unit: 'unit', // Default unit
        sku: formData.sku,
      },
    });
  };

  return (
    <>
      <Head>
        <title>Edit Product - {product.name}</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="light"
                startContent={<ArrowLeft size={20} />}
                onPress={() => router.push('/admin/products')}
              >
                Back to Products
              </Button>
              <h1 className="text-2xl font-semibold">Edit Product</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input
                    label="Product Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  <Input label="SKU" name="sku" value={formData.sku} onChange={handleInputChange} />
                </div>
                <div className="space-y-4">
                  <Input
                    label="Price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    startContent={<span className="text-default-400">$</span>}
                    required
                  />
                  <Input
                    label="Stock"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="min-h-[100px]"
              />

              <div className="flex justify-end space-x-4">
                <Button
                  color="primary"
                  type="submit"
                  startContent={<Save size={20} />}
                  isLoading={updateProductMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
