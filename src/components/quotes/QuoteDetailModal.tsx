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

// Interface for props
interface QuoteDetailModalProps {
  quoteId: string | null; // Allow null for create mode
  isOpen: boolean;
  onClose: () => void;
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
export const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({ quoteId, isOpen, onClose }) => {
  const { t } = useTranslation();
  const toast = useAppToast();
  const utils = api.useUtils();
  const isEditMode = !!quoteId;

  // Fetch quote data only in edit mode
  const { data: quoteData, isLoading: isLoadingQuote } = api.quote.getById.useQuery(
    { id: quoteId! },
    { enabled: isEditMode, refetchOnWindowFocus: false }
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

  const isLoading = isEditMode && isLoadingQuote;
  const isSubmitting = updateQuoteMutation.isPending || createQuoteMutation.isPending;

  // Determine if the form should be read-only based on status (only in edit mode)
  const isReadOnlyBasedOnStatus = useMemo(() => {
    if (!isEditMode || !quoteData) {
      return false; // Not read-only in create mode or before data loads
    }
    // Explicitly check if status is NOT DRAFT
    return quoteData.status !== ('DRAFT' as QuoteStatusType);
  }, [isEditMode, quoteData]);

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
  // Get the default markup from settings or use a fallback
  const { data: settings } = api.settings.get.useQuery();
  const defaultMarkup = useMemo(() => Number(settings?.defaultMarkupCharge ?? 10), [settings]);

  // Use useForm hook - THIS IS THE FORM OBJECT WE NEED TO PASS
  const form = useForm<QuoteDetailFormValues>({
    resolver: zodResolver(quoteDetailSchema),
    defaultValues: useMemo(
      () =>
        isEditMode && quoteData
          ? mapQuoteDataToFormValues(quoteData, defaultMarkup)
          : getInitialCreateFormValues(defaultMarkup),
      [isEditMode, quoteData, defaultMarkup]
    ),
    mode: 'onBlur', // Trigger validation on blur
  });

  // Destructure methods AFTER form is defined
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = form;

  // --- Effects --- //
  // Reset form when quoteData changes (for edit mode)
  useEffect(() => {
    if (isEditMode && quoteData) {
      reset(mapQuoteDataToFormValues(quoteData, defaultMarkup));
    }
    // If switching to create mode (quoteId becomes null), reset to initial create values
    else if (!isEditMode) {
      reset(getInitialCreateFormValues(defaultMarkup));
    }
  }, [quoteData, isEditMode, reset, defaultMarkup]);

  // Effect to reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        // Reset based on the mode it *should* be in when reopened
        reset(
          isEditMode && quoteData
            ? mapQuoteDataToFormValues(quoteData, defaultMarkup)
            : getInitialCreateFormValues(defaultMarkup)
        );
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]); // Only depend on isOpen

  // --- Calculations --- //
  const watchedValues = watch();
  const calculatedTotals = useMemo(() => {
    return calculateQuoteTotals(watchedValues);
  }, [watchedValues]);

  // --- Submit Handler ---
  const onSubmitHandler = async (data: QuoteDetailFormValues) => {
    try {
      // Ensure ID from form state matches quoteId prop in edit mode
      if (isEditMode && data.id !== quoteId) {
        console.error('Form ID mismatch');
        toast.error('An internal error occurred. Please try again.');
        return;
      }
      const apiInput = formatFormValuesToApiInput(data);
      if (isEditMode) {
        await updateQuoteMutation.mutateAsync(apiInput as QuoteUpdateInput);
      } else {
        await createQuoteMutation.mutateAsync(apiInput as QuoteCreateInput);
      }
    } catch (error) {
      console.error('Submission Error caught in onSubmitHandler:', error);
      // Errors should be handled by mutation's onError, but maybe add generic toast?
      toast.error('Failed to save quote. Please check your input.');
    }
  };

  // --- Render Logic ---
  const modalTitle = isEditMode ? t('quotes.editModalTitle') : t('quotes.createModalTitle');
  const submitButtonText = isEditMode ? t('common.saveChanges') : t('common.create');

  return (
    <Modal size="4xl" isOpen={isOpen} onClose={onClose} backdrop="blur" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="text-lg font-semibold">
          {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
          {modalTitle}
          {isEditMode && quoteData && ` (#${quoteData.sequentialId})`}
        </ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner label="Loading quote data..." />
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmitHandler)}
              id="quote-detail-form"
              className="space-y-6"
            >
              {/* --- Basic Info Card --- */}
              <Card>
                <CardBody className="space-y-4">
                  {/* Title */}
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label htmlFor={field.name} className="block text-sm font-medium">
                          {t('quotes.fields.title')} <span className="text-danger">*</span>
                        </label>
                        <Input
                          {...field}
                          id={field.name}
                          placeholder="Enter quote title"
                          disabled={isDisabled}
                          className="mt-1"
                        />
                        <FieldInfo error={errors.title} />
                      </div>
                    )}
                  />
                  {/* Customer */}
                  <Controller
                    name="customerId"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label htmlFor={field.name} className="block text-sm font-medium">
                          {t('quotes.fields.customer')} <span className="text-danger">*</span>
                        </label>
                        <CustomerSelector
                          value={field.value}
                          onChange={(id) => field.onChange(id ?? '')}
                          placeholder={t('quotes.placeholders.selectCustomer')}
                          className="mt-1"
                          disabled={isDisabled}
                        />
                        <FieldInfo error={errors.customerId} />
                      </div>
                    )}
                  />
                  {/* Notes */}
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label htmlFor={field.name} className="block text-sm font-medium">
                          {t('quotes.fields.notes')}
                        </label>
                        <Textarea
                          {...field}
                          id={field.name}
                          value={field.value ?? ''}
                          placeholder={t('quotes.placeholders.notes')}
                          disabled={isDisabled}
                          className="mt-1"
                        />
                        <FieldInfo error={errors.notes} />
                      </div>
                    )}
                  />
                </CardBody>
              </Card>

              {/* --- Task List Section --- */}
              <TaskList form={form} readOnly={isDisabled} />

              {/* --- Charges & Summary Card --- */}
              <Card>
                <CardBody>
                  <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
                    {/* Markup Percentage */}
                    <Controller
                      name="markupPercentage"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label htmlFor={field.name} className="block text-sm font-medium">
                            {t('quoteSummary.markupInputLabel')}
                          </label>
                          <NumberInput
                            {...field}
                            id={field.name}
                            value={field.value}
                            onValueChange={(v) => field.onChange(v ?? 0)}
                            placeholder="Enter markup percentage"
                            min={0}
                            max={100}
                            step={1}
                            formatOptions={{ style: 'decimal', maximumFractionDigits: 1 }}
                            endContent="%"
                            isDisabled={isDisabled}
                            className="mt-1"
                          />
                          <FieldInfo error={errors.markupPercentage} />
                        </div>
                      )}
                    />
                    {/* Quote Summary */}
                    <div className="md:col-span-2">
                      <QuoteSummary
                        {...calculatedTotals}
                        markupPercentage={watchedValues.markupPercentage}
                        readOnly={isDisabled}
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </form>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" color="default" onClick={onClose} isDisabled={isSubmitting}>
            {isReadOnlyBasedOnStatus ? t('common.close') : t('common.cancel')}
          </Button>
          {!isReadOnlyBasedOnStatus && (
            <Button
              color="primary"
              type="submit"
              form="quote-detail-form"
              isLoading={isSubmitting}
              isDisabled={isLoading || isSubmitting}
            >
              {submitButtonText}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
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
