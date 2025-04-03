'use client';

import React, { useEffect, useMemo } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Input,
  Textarea,
  NumberInput,
  Card,
  CardBody,
  // TODO: Import other necessary HeroUI components like Select, RadioGroup etc.
} from '@heroui/react';
import { api, type RouterInputs, type RouterOutputs } from '~/utils/api';
import { useAppToast } from '~/components/providers/ToastProvider'; // Correct toast import
import { useTranslation } from '~/hooks/useTranslation';
import { TaskList } from './TaskList'; // Uncomment TaskList import
import { QuoteSummary } from './QuoteSummary';
import { CustomerSelector } from '~/components/customers/CustomerSelector'; // Ensure CustomerSelect is imported
import type { QuoteStatusType } from '~/server/db/schema-exports'; // Import QuoteStatusType
import { EntityModal } from '~/components/shared/EntityModal';

// Interface for props
interface QuoteDetailModalProps {
  quoteId: string | null; // Allow null for create mode
  isOpen: boolean;
  onClose: () => void;
  isReadOnly?: boolean; // Add isReadOnly prop
}

// --- API Types ---
// Using NonNullable to ensure quoteData exists when mapping
type QuoteData = NonNullable<RouterOutputs['quote']['getById']>;

type QuoteCreateInput = RouterInputs['quote']['create'];
type QuoteUpdateInput = RouterInputs['quote']['update'];

// --- Form Value Types (Corrected Definitions) ---
// Define the type for a single material in the form state
export interface MaterialFormValues {
  id?: string; // Optional ID
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string | null; // Allow null or undefined
}

// Define the type for a single task in the form state
export interface TaskFormValues {
  id?: string; // Optional ID
  description: string;
  price: number;
  materialType: 'LUMPSUM' | 'ITEMIZED'; // Uppercase for RadioGroup
  estimatedMaterialsCostLumpSum?: number | null; // Use number for form, allow null
  materials: MaterialFormValues[]; // Use the defined material form values type
}

// Define the type for the entire quote detail form state
export interface QuoteDetailFormValues {
  id?: string; // Optional ID
  title: string;
  customerId: string;
  notes?: string | null; // Allow null or undefined
  tasks: TaskFormValues[]; // Use the defined task form values type
  markupPercentage: number;
}

// --- Zod Schemas (Aligned with Form Value Types) --- //
// Zod schema for a single material in the form
const materialSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, 'Product is required'), // Required selection
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  notes: z.string().nullable().optional(),
});

// Zod schema for a single task in the form
const taskSchema = z
  .object({
    id: z.string().optional(),
    description: z.string().min(1, 'Task description is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    materialType: z.enum(['LUMPSUM', 'ITEMIZED']), // Uppercase
    estimatedMaterialsCostLumpSum: z.number().min(0).nullable().optional(),
    // Make materials array required, matching TaskFormValues
    materials: z.array(materialSchema).default([]), // Use default([]) instead of optional()
  })
  .refine(
    (data) => {
      if (data.materialType === 'LUMPSUM') {
        return (
          data.estimatedMaterialsCostLumpSum !== null &&
          data.estimatedMaterialsCostLumpSum !== undefined
        );
      }
      // If ITEMIZED, the materials array *must* exist (schema ensures this with default)
      // Can add validation for non-empty if needed: data.materials.length > 0
      return true;
    },
    {
      message: 'Estimated cost required for Lump Sum',
      path: ['estimatedMaterialsCostLumpSum'],
    }
  );

// Main schema mirroring QuoteDetailFormValues
const quoteDetailSchema = z.object({
  id: z.string().optional(), // ID is optional
  title: z.string().min(1, 'Title is required'),
  customerId: z.string().min(1, 'Customer is required'),
  notes: z.string().nullable().optional(),
  tasks: z.array(taskSchema), // Use taskSchema, which matches TaskFormValues structure
  markupPercentage: z
    .number()
    .min(0, 'Markup must be non-negative')
    .max(100, 'Markup cannot exceed 100%'),
});

// --- End Zod Schemas --- //

// --- Helper Component for Field Errors ---
function FieldInfo({ error }: { error?: { message?: string } }) {
  return error?.message ? <p className="text-danger mt-1 text-xs">{error.message}</p> : null;
}

// --- Initial Values Functions ---
// Function to get initial form values for EDIT mode
function mapQuoteDataToFormValues(quote: QuoteData, defaultMarkup: number): QuoteDetailFormValues {
  return {
    id: quote.id,
    title: quote.title || '',
    customerId: quote.customerId || '',
    notes: quote.notes,
    markupPercentage: Number(quote.markupPercentage ?? defaultMarkup), // Ensure number
    tasks:
      quote.tasks?.map((task) => ({
        id: task.id,
        description: task.description || '',
        price: Number(task.price ?? 0), // Ensure number
        materialType: (task.materialType?.toUpperCase() || 'LUMPSUM') as 'LUMPSUM' | 'ITEMIZED',
        estimatedMaterialsCostLumpSum: Number(task.estimatedMaterialsCost ?? 0), // Ensure number
        materials:
          task.materials?.map((mat) => ({
            id: mat.id,
            productId: mat.productId, // Is string from DB
            quantity: Number(mat.quantity ?? 1), // Ensure number
            unitPrice: Number(mat.unitPrice ?? 0), // Ensure number
            notes: mat.notes || null,
          })) ?? [], // Default to empty array if task.materials is null/undefined
      })) ?? [], // Default to empty array if quote.tasks is null/undefined
  };
}

// Function to get initial form values for CREATE mode
function getInitialCreateFormValues(defaultMarkup: number): QuoteDetailFormValues {
  return {
    title: '',
    customerId: '',
    notes: null,
    markupPercentage: defaultMarkup,
    tasks: [],
  };
}

// --- Main Modal Component ---
export const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({ quoteId, isOpen, onClose, isReadOnly = false }) => {
  const { t } = useTranslation();
  const toast = useAppToast();
  const utils = api.useUtils();
  const isEditMode = !!quoteId;

  // Fetch global settings for defaults
  const { data: settings } = api.settings.get.useQuery(undefined, {
    staleTime: Infinity, // Settings rarely change
    refetchOnWindowFocus: false,
  });
  const defaultMarkup = useMemo(() => Number(settings?.defaultMarkupCharge ?? 0), [settings]);

  // Fetch quote data only in edit or view mode
  const { data: quoteData, isLoading: isLoadingQuote } = api.quote.getById.useQuery(
    { id: quoteId! },
    { enabled: isOpen && !!quoteId, refetchOnWindowFocus: false } // Fetch if modal open and ID exists
  );

  // --- Mutations ---
  const updateQuoteMutation = api.quote.update.useMutation({
    onSuccess: () => {
      toast.success(t('quotes.updateSuccessToast')); // Use specific method
      void utils.quote.getAll.invalidate();
      onClose();
    },
    onError: (error) => {
      toast.error(`${t('quotes.updateErrorToast')}: ${error.message}`); // Use specific method
    },
  });

  const createQuoteMutation = api.quote.create.useMutation({
    onSuccess: (newQuote) => {
      toast.success(`${t('quotes.createSuccess')}: ${newQuote.title}`); // Use specific method
      void utils.quote.getAll.invalidate();
      onClose(); // Close after successful creation
    },
    onError: (error) => {
      toast.error(`${t('quotes.createError') || 'Failed to create quote'}: ${error.message}`); // Use specific method
    },
  });

  const isLoading = (isEditMode || isReadOnly) && isLoadingQuote;
  const isSubmitting = updateQuoteMutation.isPending || createQuoteMutation.isPending;

  // Determine if the form should be disabled based on status OR explicit isReadOnly prop
  const isReadOnlyBasedOnStatus = useMemo(() => {
    if (isReadOnly) return true; // Always read-only if prop is set
    if (!isEditMode || !quoteData) {
      return false; // Not read-only in create mode or before data loads
    }
    return quoteData.status !== ('DRAFT' as QuoteStatusType);
  }, [isEditMode, quoteData, isReadOnly]);

  // Combine read-only status with submission status for disabling fields
  const isDisabled = isReadOnlyBasedOnStatus || isSubmitting;

  // Helper function accepts QuoteDetailFormValues
  function formatFormValuesToApiInput(
    values: QuoteDetailFormValues
  ): QuoteUpdateInput | QuoteCreateInput {
    const formattedTasks =
      values.tasks?.map((task) => ({
        ...(isEditMode && task.id ? { id: task.id } : {}), // Conditionally add task id
        description: task.description,
        price: task.price,
        materialType: (task.materialType?.toLowerCase() ?? 'lumpsum') as 'lumpsum' | 'itemized',
        estimatedMaterialsCostLumpSum:
          task.materialType === 'LUMPSUM' ? task.estimatedMaterialsCostLumpSum : undefined,
        materials:
          task.materialType === 'LUMPSUM'
            ? undefined
            : task.materials
                ?.map((mat) => ({
                  ...(isEditMode && mat.id ? { id: mat.id } : {}), // Conditionally add material id
                  quantity: mat.quantity,
                  unitPrice: mat.unitPrice,
                  productId: mat.productId,
                  notes: mat.notes || undefined,
                }))
                .filter(Boolean), // Ensure we don't send null/undefined materials in the array if map returns nothing
      })) ?? [];

    const commonData = {
      title: values.title,
      notes: values.notes,
      customerId: values.customerId,
      markupPercentage: values.markupPercentage,
      tasks: formattedTasks,
    };

    if (isEditMode) {
      if (!quoteId) throw new Error('Cannot update without quoteId');
      return { ...commonData, id: quoteId };
    } else {
      return commonData as QuoteCreateInput;
    }
  }

  // --- Form Initialization (React Hook Form) --- //
  const form = useForm<QuoteDetailFormValues>({
    resolver: zodResolver(quoteDetailSchema),
    // Initialize with default values or fetched data
    defaultValues: getInitialCreateFormValues(defaultMarkup),
  });

  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting: formIsSubmitting } } = form;

  // Reset form when modal opens or data changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode || isReadOnly) {
        if (quoteData) {
          reset(mapQuoteDataToFormValues(quoteData, defaultMarkup));
        }
      } else {
        reset(getInitialCreateFormValues(defaultMarkup));
      }
    } else {
      // Optionally reset when closing if needed
      // reset(getInitialCreateFormValues(defaultMarkup));
    }
  }, [isOpen, isEditMode, isReadOnly, quoteData, reset, defaultMarkup]);

  // --- Submit Handler ---
  const onSubmitHandler = async (data: QuoteDetailFormValues) => {
    if (isReadOnly || isReadOnlyBasedOnStatus) {
      onClose(); // Just close if read-only
      return;
    }
    const apiInput = formatFormValuesToApiInput(data);
    try {
      // *** Log raw form data ***
      console.log('Raw form data:', JSON.stringify(data, null, 2));

      // *** Log transformed data ***
      console.log('Transformed apiInput for mutation:', JSON.stringify(apiInput, null, 2));

      if (isEditMode && quoteId) {
        await updateQuoteMutation.mutateAsync({ id: quoteId, ...apiInput });
      } else {
        await createQuoteMutation.mutateAsync(apiInput as QuoteCreateInput);
      }
    } catch (error) {
      // Errors are typically handled by the mutation's onError callback
      // but we can set a generic error here if needed.
      console.error('Form submission error:', error);
      toast.error('An unexpected error occurred during submission.'); // Set a generic error
    }
  };

  // --- Calculate Totals --- //
  const watchedValues = watch(); // Watch all form values
  const totals = useMemo(() => calculateQuoteTotals(watchedValues), [watchedValues]);

  let modalTitle = isEditMode ? t('quotes.editModalTitle') : t('quotes.createModalTitle');
  if (isReadOnly) {
    modalTitle = quoteData ? t('quotes.viewModalTitle', { id: `#${quoteData.sequentialId}` }) : t('quotes.viewModalTitle', {id: '...'});
  }

  return (
    <EntityModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="5xl" // Use a larger size for quote details
      isSubmitting={isSubmitting}
      isLoading={isLoading}
      onSubmit={handleSubmit(onSubmitHandler)}
      submitText={
        isReadOnly ? t('common.close') : isEditMode ? t('common.update') : t('common.create')
      }
      hideSubmitButton={isReadOnly} // Hide submit if read-only
      hideFooter={isReadOnlyBasedOnStatus && !isReadOnly} // Hide footer completely if non-draft status (but not explicit view)
    >
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
          {/* Quote Header Section */}
          <Card>
            <CardBody>
              <h3 className="mb-4 text-lg font-semibold">{t('quotes.detailsSectionTitle')}</h3>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
                    {t('quotes.fields.title')} <span className="text-danger">*</span>
                  </label>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="title"
                        placeholder={t('quotes.placeholders.title')}
                        isInvalid={!!errors.title}
                        isDisabled={isDisabled}
                      />
                    )}
                  />
                  <FieldInfo error={errors.title} />
                </div>

                {/* Customer Selector */}
                <div>
                  <label htmlFor="customerId" className="mb-1.5 block text-sm font-medium">
                    {t('quotes.fields.customer')} <span className="text-danger">*</span>
                  </label>
                  <Controller
                    name="customerId"
                    control={control}
                    render={({ field }) => (
                      <CustomerSelector
                        value={field.value}
                        onChange={(id) => field.onChange(id)}
                        placeholder={t('quotes.placeholders.selectCustomer')}
                        isInvalid={!!errors.customerId}
                        errorMessage={errors.customerId?.message}
                        disabled={isDisabled}
                      />
                    )}
                  />
                   {/* No need for FieldInfo here as CustomerSelector handles its error display */}
                </div>

                 {/* Notes */}
                 <div className="md:col-span-2">
                  <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
                    {t('quotes.fields.notes')}
                  </label>
                   <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="notes"
                        value={field.value ?? ''} // Handle null value for textarea
                        placeholder={t('quotes.placeholders.notes')}
                        minRows={2}
                        isDisabled={isDisabled}
                        isInvalid={!!errors.notes}
                      />
                    )}
                  />
                  <FieldInfo error={errors.notes} />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Tasks Section - Corrected Props */}
          <TaskList form={form} readOnly={isDisabled} />

          {/* Summary Section - Corrected Props */}
          <QuoteSummary
             subtotalTasks={totals.subtotalTasks}
             subtotalMaterials={totals.subtotalMaterials}
             markupPercentage={watchedValues.markupPercentage} // Pass watched value for input
             markupCharge={totals.markupCharge}
             tax={totals.tax}
             grandTotal={totals.grandTotal}
             readOnly={isDisabled} // Pass combined disabled state
           />

          {/* Hidden submit button to allow form submission via Enter key */}
          {!isReadOnly && <button type="submit" className="hidden" aria-hidden="true"></button>}

        </form>
      )}
    </EntityModal>
  );
};

// Helper function to calculate totals based on form values
function calculateQuoteTotals(values: QuoteDetailFormValues) {
  let tasksTotal = 0;
  let materialsTotal = 0;

  values.tasks?.forEach((task) => {
    tasksTotal += Number(task.price) || 0;
    if (task.materialType === 'LUMPSUM') {
      materialsTotal += Number(task.estimatedMaterialsCostLumpSum) || 0;
    } else {
      task.materials?.forEach((material) => {
        materialsTotal += (Number(material.quantity) || 0) * (Number(material.unitPrice) || 0);
      });
    }
  });

  const combinedSubtotal = tasksTotal + materialsTotal;
  const markup = (combinedSubtotal * (Number(values.markupPercentage) || 0)) / 100;
  const taxAmount = (combinedSubtotal + markup) * 0.07;
  const roundedTax = Math.round(taxAmount * 100) / 100;
  const total = combinedSubtotal + markup + roundedTax;

  return {
    subtotalTasks: tasksTotal,
    subtotalMaterials: materialsTotal,
    markupCharge: markup,
    tax: roundedTax,
    grandTotal: total,
  };
}
