'use client';

import React, { useEffect } from 'react';
import { EntityModal } from '~/components/shared/EntityModal';
// Remove RouterOutputs import if no longer needed after type change
// import type { RouterOutputs } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { Input, Textarea, Select, SelectItem, NumberInput } from '@heroui/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '~/utils/api';
// Import Drizzle schema and helper
// Remove unused enum import if not needed elsewhere
// import { products as productsTable, productCategoryEnum } from '~/server/db/schema'; // Removed comment
import { products as productsTable } from '~/server/db/schema';
import { type InferSelectModel } from 'drizzle-orm';

// Use InferSelectModel for the Product type
type Product = InferSelectModel<typeof productsTable>;

// Define Zod Schema for Product Form Validation - Align with backend productInput
const getProductSchema = () =>
  z.object({
    // Match backend: name is required
    name: z.string().min(1, 'Name is required'),
    // Match backend: optional strings
    description: z.string().optional(),
    // Use categoryId (UUID string) consistent with DB/Service
    categoryId: z.string().uuid('Invalid category ID').nullable(),
    // Match backend: unitPrice is required, non-negative number
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    // Match backend: unit is required string (or nullish converted to empty)
    unit: z.string().min(1, 'Unit is required').nullish(),
    // Match backend: optional strings
    sku: z.string().optional(),
    manufacturer: z.string().optional(),
    supplier: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
  });

// Define the type based on the schema for use in the form
export type ProductFormData = z.infer<ReturnType<typeof getProductSchema>>;

// Type for data submitted (unitPrice as number)
export type ProductSubmitData = ProductFormData & { id?: string };

interface ProductFormModalProps {
  initialData?: Product; // Use the updated Product type
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductSubmitData) => Promise<void>;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  title?: string;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  initialData,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting: externalIsSubmitting = false,
  isReadOnly = false,
  title,
}) => {
  const { t } = useTranslation();
  const productSchema = getProductSchema();

  // Fetch categories using the ProductCategory router
  const { data: categories, isLoading: isLoadingCategories } =
    api.productCategory.getAll.useQuery();

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? undefined,
      categoryId: initialData?.categoryId ?? null,
      unitPrice: Number(initialData?.unitPrice ?? 0),
      unit: initialData?.unit ?? '',
      sku: initialData?.sku ?? undefined,
      manufacturer: initialData?.manufacturer ?? undefined,
      supplier: initialData?.supplier ?? undefined,
      location: initialData?.location ?? undefined,
      notes: initialData?.notes ?? undefined,
    },
  });

  const onSubmitRHF = async (data: ProductFormData) => {
    if (isReadOnly) {
      onClose();
      return;
    }
    // Submit data (parent page handles actual mutation)
    await onSubmit({
      ...data,
      id: initialData?.id,
      categoryId: data.categoryId,
      unit: data.unit ?? '',
    });
  };

  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name ?? '',
        description: initialData?.description ?? undefined,
        categoryId: initialData?.categoryId ?? null,
        unitPrice: Number(initialData?.unitPrice ?? 0),
        unit: initialData?.unit ?? '',
        sku: initialData?.sku ?? undefined,
        manufacturer: initialData?.manufacturer ?? undefined,
        supplier: initialData?.supplier ?? undefined,
        location: initialData?.location ?? undefined,
        notes: initialData?.notes ?? undefined,
      });
    }
  }, [isOpen, initialData, reset]);

  let currentTitle = title;
  if (!currentTitle) {
    currentTitle = initialData ? t('products.editModalTitle') : t('products.createModalTitle');
  }
  if (isReadOnly && !title) {
    currentTitle = t('products.viewModalTitle');
  }

  const isSubmitting = formIsSubmitting || externalIsSubmitting;

  return (
    <EntityModal
      isOpen={isOpen}
      onClose={onClose}
      title={currentTitle}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(onSubmitRHF)}
      submitText={
        isReadOnly ? t('common.close') : initialData ? t('common.update') : t('common.create')
      }
    >
      <form
        onSubmit={handleSubmit(onSubmitRHF)}
        className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2"
      >
        {/* Name Input */}
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {t('productFields.name')} <span className="text-danger">*</span>
          </label>
          <Input
            id="name"
            {...register('name')}
            placeholder={t('productPlaceholders.name')}
            isDisabled={isReadOnly || isSubmitting}
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message} // Display Zod error message
            className="mt-1"
          />
        </div>

        {/* Description Textarea */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            {t('productFields.description')}
          </label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder={t('productPlaceholders.description')}
            isDisabled={isReadOnly || isSubmitting}
            isInvalid={!!errors.description}
            errorMessage={errors.description?.message}
            minRows={3}
            className="mt-1"
          />
        </div>

        {/* Category Select */}
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
            {t('productFields.category')} <span className="text-danger">*</span>
          </label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select
                id="categoryId"
                selectedKeys={field.value ? [field.value] : []}
                onBlur={field.onBlur}
                onSelectionChange={(keys) => field.onChange(Array.from(keys)[0] ?? null)}
                placeholder={t('productPlaceholders.category')}
                isDisabled={isReadOnly || isLoadingCategories || isSubmitting}
                isInvalid={!!errors.categoryId}
                errorMessage={errors.categoryId?.message}
                isLoading={isLoadingCategories}
                className="mt-1"
                aria-label={t('productFields.category')}
              >
                {(categories ?? []).map((category) => (
                  <SelectItem key={category.id} textValue={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </Select>
            )}
          />
        </div>

        {/* Unit Price NumberInput */}
        <div>
          <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">
            {t('productFields.unitPrice')} <span className="text-danger">*</span>
          </label>
          <Controller
            name="unitPrice"
            control={control}
            render={({ field }) => (
              <NumberInput
                id="unitPrice"
                value={field.value ?? 0} // Default to 0 if null/undefined
                onBlur={field.onBlur}
                onValueChange={field.onChange}
                placeholder="0.00"
                isDisabled={isReadOnly || isSubmitting}
                isInvalid={!!errors.unitPrice}
                errorMessage={errors.unitPrice?.message}
                min={0} // Ensure non-negative
                step={0.01} // Allow cents
                formatOptions={{
                  style: 'decimal',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
                className="mt-1"
              />
            )}
          />
        </div>

        {/* Unit Input */}
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
            {t('productFields.unit')} <span className="text-danger">*</span>
          </label>
          <Input
            id="unit"
            {...register('unit')}
            placeholder={t('productPlaceholders.unit')}
            isDisabled={isReadOnly || isSubmitting}
            isInvalid={!!errors.unit}
            errorMessage={errors.unit?.message}
            className="mt-1"
          />
        </div>

        {/* SKU Input */}
        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
            {t('productFields.sku')}
          </label>
          <Input
            id="sku"
            {...register('sku')}
            placeholder={t('productPlaceholders.sku')}
            isDisabled={isReadOnly || isSubmitting}
            isInvalid={!!errors.sku}
            errorMessage={errors.sku?.message}
            className="mt-1"
          />
        </div>

        {/* Manufacturer Input */}
        <div>
          <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700">
            {t('productFields.manufacturer')}
          </label>
          <Input
            id="manufacturer"
            {...register('manufacturer')}
            placeholder={t('productPlaceholders.manufacturer')}
            isDisabled={isReadOnly || isSubmitting}
            isInvalid={!!errors.manufacturer}
            errorMessage={errors.manufacturer?.message}
            className="mt-1"
          />
        </div>

        {/* Supplier Input */}
        <div>
          <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
            {t('productFields.supplier')}
          </label>
          <Input
            id="supplier"
            {...register('supplier')}
            placeholder={t('productPlaceholders.supplier')}
            isDisabled={isReadOnly || isSubmitting}
            isInvalid={!!errors.supplier}
            errorMessage={errors.supplier?.message}
            className="mt-1"
          />
        </div>

        {/* Location Input */}
        <div className="md:col-span-1">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            {t('productFields.location')}
          </label>
          <Input
            id="location"
            {...register('location')}
            placeholder={t('productPlaceholders.location')}
            isDisabled={isReadOnly || isSubmitting}
            isInvalid={!!errors.location}
            errorMessage={errors.location?.message}
            className="mt-1"
          />
        </div>

        {/* Notes Textarea */}
        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            {t('productFields.notes')}
          </label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder={t('productPlaceholders.notes')}
            isDisabled={isReadOnly || isSubmitting}
            isInvalid={!!errors.notes}
            errorMessage={errors.notes?.message}
            minRows={3}
            className="mt-1"
          />
        </div>
      </form>
    </EntityModal>
  );
};
