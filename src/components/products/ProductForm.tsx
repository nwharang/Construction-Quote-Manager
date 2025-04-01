'use client';

import React from 'react';
import { z } from 'zod';
import { useRouter } from 'next/router';
import type { RouterOutputs } from '~/utils/api';
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
import { KeyboardFocusWrapper } from '~/components/ui/KeyboardFocusWrapper';
import { useEntityForm } from '~/hooks/useEntityForm';

// Get product categories from schema enum
const PRODUCT_CATEGORIES = [
  { label: 'Lumber', value: 'LUMBER' },
  { label: 'Plumbing', value: 'PLUMBING' },
  { label: 'Electrical', value: 'ELECTRICAL' },
  { label: 'Paint', value: 'PAINT' },
  { label: 'Hardware', value: 'HARDWARE' },
  { label: 'Tools', value: 'TOOLS' },
  { label: 'Other', value: 'OTHER' }
];

// Create schema for product data validation
export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  category: z.enum(['LUMBER', 'PLUMBING', 'ELECTRICAL', 'PAINT', 'HARDWARE', 'TOOLS', 'OTHER']),
  unitPrice: z.number().min(0, 'Price must be a positive number'),
  unit: z.string().min(1, 'Unit is required'),
  sku: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type ProductFormData = z.infer<typeof productSchema>;

type Product = RouterOutputs['product']['getById'];

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
  backUrl?: string;
}

export function ProductForm({ 
  product, 
  onSubmit, 
  isLoading = false,
  backUrl = '/admin/products'
}: ProductFormProps) {
  const router = useRouter();
  
  // Initialize default values
  const defaultValues: ProductFormData = {
    name: '',
    description: '',
    category: 'OTHER',
    unitPrice: 0,
    unit: 'ea',
    sku: '',
    manufacturer: '',
    supplier: '',
    location: '',
    notes: '',
  };
  
  // Process product data if it exists
  const initialData = product ? {
    ...defaultValues,
    ...product,
    unitPrice: typeof product.unitPrice === 'string' 
      ? parseFloat(product.unitPrice) 
      : product.unitPrice,
  } : undefined;
  
  // Use our entity form hook
  const {
    formData,
    formErrors,
    isSubmitting,
    isEdit,
    handleChange,
    handleSubmit
  } = useEntityForm<ProductFormData>({
    initialData,
    defaultValues,
    schema: productSchema,
    onSubmit,
    successMessage: {
      create: 'Product created successfully',
      update: 'Product updated successfully'
    }
  });

  // Define product form fields
  const productFields: EntityFormField<ProductFormData>[] = [
    {
      key: 'name',
      label: 'Product Name',
      type: 'text',
      required: true,
      placeholder: 'Enter product name',
      renderInput: (props) => (
        <TextField
          value={props.value}
          onChange={props.onChange}
          label="Product Name"
          placeholder="Enter product name"
          required={props.required}
          error={props.error}
        />
      ),
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      renderInput: (props) => (
        <TextAreaField
          value={props.value || ''}
          onChange={props.onChange}
          label="Description"
          placeholder="Enter product description"
          error={props.error}
          rows={3}
        />
      ),
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
          label="Category"
          options={PRODUCT_CATEGORIES}
          required={props.required}
          error={props.error}
        />
      ),
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
        />
      ),
    },
    {
      key: 'unit',
      label: 'Unit of Measure',
      type: 'text',
      required: true,
      placeholder: 'e.g., ea, ft, sq ft, lb',
      renderInput: (props) => (
        <TextField
          value={props.value}
          onChange={props.onChange}
          label="Unit of Measure"
          placeholder="e.g., ea, ft, sq ft, lb"
          required={props.required}
          error={props.error}
        />
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      type: 'text',
      renderInput: (props) => (
        <TextField
          value={props.value || ''}
          onChange={props.onChange}
          label="SKU"
          placeholder="Enter SKU"
          error={props.error}
        />
      ),
    },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      type: 'text',
      renderInput: (props) => (
        <TextField
          value={props.value || ''}
          onChange={props.onChange}
          label="Manufacturer"
          placeholder="Enter manufacturer"
          error={props.error}
        />
      ),
    },
    {
      key: 'supplier',
      label: 'Supplier',
      type: 'text',
      renderInput: (props) => (
        <TextField
          value={props.value || ''}
          onChange={props.onChange}
          label="Supplier"
          placeholder="Enter supplier"
          error={props.error}
        />
      ),
    },
    {
      key: 'location',
      label: 'Storage Location',
      type: 'text',
      renderInput: (props) => (
        <TextField
          value={props.value || ''}
          onChange={props.onChange}
          label="Storage Location"
          placeholder="Enter storage location"
          error={props.error}
        />
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      type: 'textarea',
      renderInput: (props) => (
        <TextAreaField
          value={props.value || ''}
          onChange={props.onChange}
          label="Notes"
          placeholder="Enter any additional notes"
          error={props.error}
          rows={3}
        />
      ),
    },
  ];

  // Define form sections for better organization
  const sections = [
    {
      title: 'Product Information',
      fields: ['name', 'description', 'category', 'unitPrice', 'unit'] as Array<keyof ProductFormData>
    },
    {
      title: 'Inventory Details',
      fields: ['sku', 'manufacturer', 'supplier', 'location', 'notes'] as Array<keyof ProductFormData>
    }
  ];

  return (
    <KeyboardFocusWrapper>
      <EntityForm
        title={isEdit ? 'Edit Product' : 'New Product'}
        entity={formData}
        fields={productFields}
        sections={sections}
        errors={formErrors}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        backUrl={backUrl}
        onSubmit={handleSubmit}
        onChange={handleChange}
        submitText={isEdit ? 'Update Product' : 'Create Product'}
      />
    </KeyboardFocusWrapper>
  );
} 