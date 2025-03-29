import { type NextPage } from 'next';
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
import { useState } from 'react';

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

const NewProductPage: NextPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useAppToast();
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: ProductCategory.OTHER,
    unitPrice: 0,
    unit: '',
    sku: '',
    manufacturer: '',
    supplier: '',
    location: '',
    notes: '',
  });

  const createProduct = api.product.create.useMutation({
    onSuccess: () => {
      toast.success('Product created successfully');
      router.push('/admin/products');
    },
    onError: (error) => {
      toast.error(`Failed to create product: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Submitting product data:', formData);
      await createProduct.mutateAsync({
        ...formData,
        // Ensure notes is included even if undefined
        notes: formData.notes || '',
      });
    } catch (error) {
      console.error('Error submitting product:', error);
      // Error handling is done in the onError callback
    }
  };

  const handleChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (status === 'loading') {
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
        <title>New Product - Admin Dashboard</title>
      </Head>

      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-none shadow-none">
            <CardHeader className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold">New Product</h1>
              <p className="text-gray-600">Add a new product to your catalog</p>
            </CardHeader>
            <CardBody className="border-none">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Input
                    label="Name"
                    placeholder="Enter product name"
                    value={formData.name}
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
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />

                  <Select
                    label="Category"
                    placeholder="Select a category"
                    selectedKeys={[formData.category]}
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
                      value={formData.unitPrice}
                      onValueChange={(value) => handleChange('unitPrice', Number(value))}
                      required
                      min={0}
                      step={0.01}
                      radius="none"
                      classNames={{
                        inputWrapper: "border-none"
                      }}
                      aria-label="Product Unit Price"
                    />

                    <Input
                      label="Unit"
                      placeholder="e.g., pcs, kg, m"
                      value={formData.unit}
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
                    value={formData.sku}
                    onChange={(e) => handleChange('sku', e.target.value)}
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />

                  <Input
                    label="Manufacturer (Optional)"
                    placeholder="Enter manufacturer name"
                    value={formData.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />

                  <Input
                    label="Supplier (Optional)"
                    placeholder="Enter supplier name"
                    value={formData.supplier}
                    onChange={(e) => handleChange('supplier', e.target.value)}
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />

                  <Input
                    label="Location (Optional)"
                    placeholder="Enter storage location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />

                  <Textarea
                    label="Notes (Optional)"
                    placeholder="Enter any additional notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />
                </div>

                <Divider />

                <div className="flex justify-end gap-4">
                  <Button
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
                    Create Product
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
};

export default NewProductPage; 