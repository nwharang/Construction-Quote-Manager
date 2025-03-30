import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';
import { Spinner } from '@heroui/react';
import { ProductCategory } from '~/server/db/schema';
import { useAppToast } from '~/components/providers/ToastProvider';
import { Layout } from '~/components/Layout';
import { 
  EntityForm, 
  type EntityFormField 
} from '~/components/shared/EntityForm';
import { 
  TextField, 
  TextAreaField, 
  CurrencyField, 
  SelectField 
} from '~/components/shared/EntityFormFields';
import type { Product } from '~/types/quote';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const { status } = useSession();
  const toast = useAppToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productData, setProductData] = useState<Product | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Product, string>>>({});
  const utils = api.useUtils();

  // Fetch product data
  const productQuery = api.product.getById.useQuery(
    { id: id as string },
    { enabled: !!id && typeof id === 'string' }
  );

  // Set product data when fetched
  useEffect(() => {
    if (productQuery.data) {
      // Convert unitPrice from string to number
      const product: Product = {
        ...productQuery.data,
        unitPrice: typeof productQuery.data.unitPrice === 'string' 
          ? parseFloat(productQuery.data.unitPrice) 
          : productQuery.data.unitPrice
      };
      setProductData(product);
    }
  }, [productQuery.data]);

  // Handle API errors
  useEffect(() => {
    if (!productQuery.isLoading && productQuery.error) {
      toast.error(`Error fetching product: ${productQuery.error.message}`);
      router.push('/admin/products');
    }
  }, [productQuery.isLoading, productQuery.error, router, toast]);

  // Update product mutation
  const updateProductMutation = api.product.update.useMutation({
    onSuccess: () => {
      toast.success('Product updated successfully');
      utils.product.getAll.invalidate();
      router.push('/admin/products');
    },
    onError: (error) => {
      toast.error(`Error updating product: ${error.message}`);
      setIsSubmitting(false);
    }
  });

  // Handle form value changes
  const handleChange = (field: keyof Product, value: any) => {
    if (!productData) return;
    
    setProductData({
      ...productData,
      [field]: value
    });
    
    // Clear error when field is edited
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: undefined
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (data: Product) => {
    // Validate form
    const newErrors: Partial<Record<keyof Product, string>> = {};
    
    if (!data.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!data.category) {
      newErrors.category = 'Category is required';
    }
    
    if (data.unitPrice < 0) {
      newErrors.unitPrice = 'Price must be a positive number';
    }
    
    if (!data.unit?.trim()) {
      newErrors.unit = 'Unit is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const category = data.category as typeof ProductCategory[keyof typeof ProductCategory];
      
      await updateProductMutation.mutateAsync({
        id: data.id,
        data: {
          name: data.name,
          description: data.description || undefined,
          category,
          unitPrice: data.unitPrice,
          unit: data.unit,
          sku: data.sku || undefined,
          manufacturer: data.manufacturer || undefined,
          supplier: data.supplier || undefined,
          location: data.location || undefined,
          notes: data.notes || undefined,
        }
      });
    } catch (error) {
      // Error handling is done in the onError callback
      console.error('Failed to update product:', error);
    }
  };

  // Check authentication status
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Define form fields
  const productFields: EntityFormField<Product>[] = [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      renderInput: (props) => (
        <TextField
          value={props.value}
          onChange={props.onChange}
          placeholder="Enter product name"
          label="Name"
          required={props.required}
          error={props.error}
        />
      )
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      renderInput: (props) => (
        <TextAreaField
          value={props.value || ''}
          onChange={props.onChange}
          placeholder="Enter product description"
          label="Description"
          rows={3}
          error={props.error}
        />
      )
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      renderInput: (props) => (
        <SelectField
          value={props.value}
          onChange={props.onChange}
          options={Object.values(ProductCategory).map(category => ({
            label: category,
            value: category
          }))}
          label="Category"
          placeholder="Select a category"
          required={props.required}
          error={props.error}
        />
      )
    },
    {
      key: 'unitPrice',
      label: 'Unit Price',
      type: 'currency',
      required: true,
      renderInput: (props) => (
        <CurrencyField
          value={props.value}
          onChange={props.onChange}
          label="Unit Price"
          required={props.required}
          error={props.error}
          min={0}
        />
      )
    },
    {
      key: 'unit',
      label: 'Unit',
      type: 'text',
      required: true,
      renderInput: (props) => (
        <TextField
          value={props.value}
          onChange={props.onChange}
          placeholder="e.g., pcs, kg, m"
          label="Unit"
          required={props.required}
          error={props.error}
        />
      )
    },
    {
      key: 'sku',
      label: 'SKU',
      type: 'text',
      renderInput: (props) => (
        <TextField
          value={props.value || ''}
          onChange={props.onChange}
          placeholder="Leave empty for auto-generation"
          label="SKU (Optional)"
          error={props.error}
        />
      )
    },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      type: 'text',
      renderInput: (props) => (
        <TextField
          value={props.value || ''}
          onChange={props.onChange}
          placeholder="Enter manufacturer name"
          label="Manufacturer (Optional)"
          error={props.error}
        />
      )
    },
    {
      key: 'supplier',
      label: 'Supplier',
      type: 'text',
      renderInput: (props) => (
        <TextField
          value={props.value || ''}
          onChange={props.onChange}
          placeholder="Enter supplier name"
          label="Supplier (Optional)"
          error={props.error}
        />
      )
    },
    {
      key: 'location',
      label: 'Location',
      type: 'text',
      renderInput: (props) => (
        <TextField
          value={props.value || ''}
          onChange={props.onChange}
          placeholder="Enter storage location"
          label="Location (Optional)"
          error={props.error}
        />
      )
    },
    {
      key: 'notes',
      label: 'Notes',
      type: 'textarea',
      renderInput: (props) => (
        <TextAreaField
          value={props.value || ''}
          onChange={props.onChange}
          placeholder="Enter any additional notes"
          label="Notes (Optional)"
          rows={3}
          error={props.error}
        />
      )
    }
  ];

  if (productQuery.isLoading || !productData) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" color="primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Edit Product - Admin Dashboard</title>
      </Head>

      <div className="p-6">
        <EntityForm<Product>
          title="Edit Product"
          entity={productData}
          fields={productFields}
          errors={errors}
          isSubmitting={isSubmitting}
          showBackButton={true}
          backUrl="/admin/products"
          onSubmit={handleSubmit}
          onChange={handleChange}
          submitText="Update Product"
        />
      </div>
    </Layout>
  );
}
