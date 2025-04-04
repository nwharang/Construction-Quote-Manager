import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { 
  Button, 
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Spinner,
  Select,
  SelectItem,
} from '@heroui/react';
import { ArrowLeft, Save, ChevronRight } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from '~/hooks/useTranslation';
import { api } from '~/utils/api';
import { withMainLayout } from '~/utils/withAuth';
import { useAppToast } from '~/components/providers/ToastProvider';
import Link from 'next/link';
import { CurrencyInput } from '~/components/ui/CurrencyInput';

// Validation schema for product form
const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable(),
  categoryId: z.string().uuid('Invalid category ID').nullable(),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  unit: z.string().nullable(),
  sku: z.string().nullable(),
  manufacturer: z.string().nullable(),
  supplier: z.string().nullable(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
});

type ProductFormValues = z.infer<typeof productSchema>;

function EditProduct() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { t } = useTranslation();
  const toast = useAppToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = api.productCategory.getAll.useQuery();

  // Get product data
  const { data: product, isLoading } = api.product.getById.useQuery(
    { id },
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  );

  // Set up form with validation
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: null,
      categoryId: null,
      unitPrice: 0,
      unit: null,
      sku: null,
      manufacturer: null,
      supplier: null,
      location: null,
      notes: null,
    },
  });

  // Update form values when product data is loaded
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        unitPrice: Number(product.unitPrice),
        unit: product.unit,
        sku: product.sku,
        manufacturer: product.manufacturer,
        supplier: product.supplier,
        location: product.location,
        notes: product.notes,
      });
    }
  }, [product, reset]);

  // Update mutation
  const { mutate: updateProduct } = api.product.update.useMutation({
    onSuccess: () => {
      toast.success(t('products.updateSuccess'));
      router.push(`/admin/products/${id}/view`);
    },
    onError: (error) => {
      toast.error(error.message || t('products.updateError'));
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = (data: ProductFormValues) => {
    setIsSubmitting(true);
    updateProduct({
      id,
      ...data,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">Product not found</h2>
        <Button
          color="primary"
          variant="light"
          className="mt-4"
          startContent={<ArrowLeft size={16} />}
          onPress={() => router.push('/admin/products')}
        >
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <nav className="flex items-center">
          <Link 
            href="/admin/products" 
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            Products
          </Link>
          <ChevronRight size={16} className="mx-2 text-gray-400" />
          <Link 
            href={`/admin/products/${id}`}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            {product?.name || 'Product Details'}
          </Link>
          <ChevronRight size={16} className="mx-2 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">Edit</span>
        </nav>
        
        <div className="flex gap-2">
          <Button
            color="primary"
            variant="light"
            startContent={<ArrowLeft size={16} />}
            onPress={() => router.push(`/admin/products/${id}`)}
          >
            Back
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Edit Product</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Name"
                      isRequired
                      isInvalid={!!errors.name}
                      errorMessage={errors.name?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </div>

              <div>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      label="Description"
                      isInvalid={!!errors.description}
                      errorMessage={errors.description?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Controller
                    name="unitPrice"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        label="Price"
                        value={field.value}
                        onValueChange={field.onChange}
                        isInvalid={!!errors.unitPrice}
                        errorMessage={errors.unitPrice?.message}
                      />
                    )}
                  />
                </div>

                <div>
                  <Controller
                    name="unit"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Unit"
                        isInvalid={!!errors.unit}
                        errorMessage={errors.unit?.message}
                        value={field.value || ''}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Controller
                    name="sku"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="SKU"
                        isInvalid={!!errors.sku}
                        errorMessage={errors.sku?.message}
                        value={field.value || ''}
                      />
                    )}
                  />
                </div>

                <div>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Category"
                        placeholder="Select a category"
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(keys) => field.onChange(Array.from(keys)[0] || null)}
                        isLoading={isLoadingCategories}
                        isInvalid={!!errors.categoryId}
                        errorMessage={errors.categoryId?.message}
                      >
                        {(categories || []).map((category) => (
                          <SelectItem key={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Controller
                    name="manufacturer"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Manufacturer"
                        isInvalid={!!errors.manufacturer}
                        errorMessage={errors.manufacturer?.message}
                        value={field.value || ''}
                      />
                    )}
                  />
                </div>

                <div>
                  <Controller
                    name="supplier"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Supplier"
                        isInvalid={!!errors.supplier}
                        errorMessage={errors.supplier?.message}
                        value={field.value || ''}
                      />
                    )}
                  />
                </div>
              </div>

              <div>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Location"
                      isInvalid={!!errors.location}
                      errorMessage={errors.location?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </div>

              <div>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      label="Notes"
                      isInvalid={!!errors.notes}
                      errorMessage={errors.notes?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                color="primary"
                isLoading={isSubmitting}
                startContent={<Save size={16} />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default withMainLayout(EditProduct);