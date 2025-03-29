import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Textarea,
  Spinner,
  NumberInput,
  Divider,
} from '@heroui/react';
import { ProductCategory } from '~/server/db/schema';
import { useAppToast } from '~/components/providers/ToastProvider';
import { useProducts } from '~/contexts/ProductsContext';

type ProductFormData = {
  name: string;
  description: string;
  category: typeof ProductCategory[keyof typeof ProductCategory];
  unitPrice: number;
  unit: string;
  sku?: string;
  manufacturer?: string;
  supplier?: string;
  location?: string;
  notes?: string;
};

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const { status } = useSession();
  const toast = useAppToast();
  const { productFormData, setProductFormData, updateProduct, isSubmitting, fetchProductById, loading } = useProducts();

  // Fetch product when component mounts
  useEffect(() => {
    if (id && typeof id === 'string' && status === 'authenticated') {
      fetchProductById(id);
    }
  }, [id, status]);

  const handleChange = (field: keyof typeof productFormData, value: string | number) => {
    setProductFormData({ [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id && typeof id === 'string') {
      const success = await updateProduct(id);
      if (success) {
        router.push('/admin/products');
      }
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <>
      <Head>
        <title>Edit Product - Admin Dashboard</title>
      </Head>

      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-none shadow-none">
            <CardHeader className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold">Edit Product</h1>
              <p className="text-gray-600">Update product information</p>
            </CardHeader>
            <CardBody className="border-none">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Input
                    label="Name"
                    placeholder="Enter product name"
                    value={productFormData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />

                  <Textarea
                    label="Description"
                    placeholder="Enter product description"
                    value={productFormData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />

                  <Select
                    label="Category"
                    placeholder="Select a category"
                    selectedKeys={[productFormData.category]}
                    onChange={(e) => handleChange('category', e.target.value)}
                    required
                    aria-label="Select product category"
                    radius="none"
                    classNames={{
                      trigger: "border-none"
                    }}
                  >
                    {Object.values(ProductCategory).map((category) => (
                      <SelectItem key={category} textValue={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </Select>

                  <div className="grid grid-cols-2 gap-4">
                    <NumberInput
                      label="Unit Price"
                      placeholder="0.00"
                      value={productFormData.unitPrice}
                      onValueChange={(value) => handleChange('unitPrice', Number(value))}
                      required
                      min={0}
                      step={0.01}
                      radius="none"
                      classNames={{
                        inputWrapper: "border-none"
                      }}
                      aria-label="Product Unit Price"
                      startContent="$"
                      formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                    />

                    <Input
                      label="Unit"
                      placeholder="e.g., pcs, kg, m"
                      value={productFormData.unit}
                      onChange={(e) => handleChange('unit', e.target.value)}
                      required
                      radius="none"
                      classNames={{
                        inputWrapper: "border-none"
                      }}
                    />
                  </div>

                  <Input
                    label="SKU (Optional)"
                    placeholder="Leave empty for auto-generation"
                    value={productFormData.sku}
                    onChange={(e) => handleChange('sku', e.target.value)}
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />

                  <Input
                    label="Manufacturer (Optional)"
                    placeholder="Enter manufacturer name"
                    value={productFormData.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />

                  <Input
                    label="Supplier (Optional)"
                    placeholder="Enter supplier name"
                    value={productFormData.supplier}
                    onChange={(e) => handleChange('supplier', e.target.value)}
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />

                  <Input
                    label="Location (Optional)"
                    placeholder="Enter storage location"
                    value={productFormData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />

                  <Textarea
                    label="Notes (Optional)"
                    placeholder="Enter additional notes"
                    value={productFormData.notes || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />

                  <Divider className="my-4" />

                  <div className="flex justify-end gap-2">
                    <Button
                      color="default"
                      variant="flat"
                      onPress={() => router.push('/admin/products')}
                    >
                      Cancel
                    </Button>

                    <Button
                      color="primary"
                      type="submit"
                      isLoading={isSubmitting}
                    >
                      Update Product
                    </Button>
                  </div>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
