import React from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Select,
  SelectItem,
  Divider,
} from '@heroui/react';
import { Save } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useTranslation } from '~/hooks/useTranslation';
import { api } from '~/utils/api';
import { CurrencyInput } from '~/components/ui/CurrencyInput';

// Validation schema for product form
const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable(),
  categoryId: z.string().nullable(),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  unit: z.string().nullable(),
  sku: z.string().nullable(),
  manufacturer: z.string().nullable(),
  supplier: z.string().nullable(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData: ProductFormValues;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
}

export function ProductForm({
  initialData,
  onSubmit,
  isLoading,
  submitLabel = 'Save',
}: ProductFormProps) {
  const { t } = useTranslation();

  // Fetch categories
  const { data: categories } = api.productCategory.getAll.useQuery();

  // Set up form with validation
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData,
  });

  // Handle form submission
  const handleFormSubmit = async (data: ProductFormValues) => {
    await onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">{t('products.formTitle')}</h2>
      </CardHeader>
      <Divider />
      <CardBody>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
            <div className="flex items-baseline md:col-span-2">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t('products.form.name')}
                    labelPlacement="outside"
                    placeholder={t('products.placeholders.name')}
                    isRequired
                    isInvalid={!!errors.name}
                    errorMessage={errors.name?.message}
                    value={field.value || ''}
                  />
                )}
              />
            </div>

            <div className="flex items-baseline md:col-span-2">
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label={t('products.form.description')}
                    labelPlacement="outside"
                    placeholder={t('products.placeholders.description')}
                    isInvalid={!!errors.description}
                    errorMessage={errors.description?.message}
                    value={field.value || ''}
                    minRows={3}
                  />
                )}
              />
            </div>

            <div className="flex items-baseline">
              <Controller
                name="unitPrice"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <CurrencyInput
                    label={t('products.form.price')}
                    labelPlacement="outside"
                    placeholder={t('products.placeholders.price')}
                    isRequired
                    value={field.value ?? 0}
                    onValueChange={field.onChange}
                    isInvalid={!!error}
                    errorMessage={error?.message}
                  />
                )}
              />
            </div>

            <div className="flex items-baseline">
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t('products.form.unit')}
                    labelPlacement="outside"
                    placeholder={t('products.placeholders.unit')}
                    isInvalid={!!errors.unit}
                    errorMessage={errors.unit?.message}
                    value={field.value || ''}
                  />
                )}
              />
            </div>

            <div className="flex items-baseline">
              <Controller
                name="sku"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t('products.form.sku')}
                    labelPlacement="outside"
                    placeholder={t('products.placeholders.sku')}
                    isInvalid={!!errors.sku}
                    errorMessage={errors.sku?.message}
                    value={field.value || ''}
                  />
                )}
              />
            </div>

            <div className="flex items-baseline">
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('products.form.category')}
                    labelPlacement="outside"
                    placeholder={t('products.form.selectCategory')}
                    selectedKeys={field.value ? [field.value] : []}
                    onSelectionChange={(keys) => field.onChange(Array.from(keys)[0] || null)}
                    isLoading={!categories}
                    isInvalid={!!errors.categoryId}
                    errorMessage={errors.categoryId?.message}
                  >
                    {(categories || []).map((category) => (
                      <SelectItem key={category.id}>{category.name}</SelectItem>
                    ))}
                  </Select>
                )}
              />
            </div>

            <div className="flex items-baseline">
              <Controller
                name="manufacturer"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t('products.form.manufacturer')}
                    labelPlacement="outside"
                    placeholder={t('products.placeholders.manufacturer')}
                    isInvalid={!!errors.manufacturer}
                    errorMessage={errors.manufacturer?.message}
                    value={field.value || ''}
                  />
                )}
              />
            </div>

            <div className="flex items-baseline">
              <Controller
                name="supplier"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t('products.form.supplier')}
                    labelPlacement="outside"
                    placeholder={t('products.placeholders.supplier')}
                    isInvalid={!!errors.supplier}
                    errorMessage={errors.supplier?.message}
                    value={field.value || ''}
                  />
                )}
              />
            </div>

            <div className="flex items-baseline md:col-span-2">
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t('products.form.location')}
                    labelPlacement="outside"
                    placeholder={t('products.placeholders.location')}
                    isInvalid={!!errors.location}
                    errorMessage={errors.location?.message}
                    value={field.value || ''}
                  />
                )}
              />
            </div>

            <div className="flex items-baseline md:col-span-2">
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label={t('products.form.notes')}
                    labelPlacement="outside"
                    placeholder={t('products.placeholders.notes')}
                    isInvalid={!!errors.notes}
                    errorMessage={errors.notes?.message}
                    value={field.value || ''}
                    minRows={3}
                  />
                )}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              startContent={<Save className="h-4 w-4" />}
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
