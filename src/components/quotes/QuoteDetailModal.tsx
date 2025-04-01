'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm, type FieldApi } from '@tanstack/react-form';
import { z } from 'zod';
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
  // TODO: Import other necessary HeroUI components like NumberInput, Select, RadioGroup etc.
} from '@heroui/react';
import { api, type RouterInputs, type RouterOutputs } from '~/utils/api';
import { useToastStore } from '~/store';
import { useTranslation } from '~/hooks/useTranslation';
import { TaskList } from './TaskList'; // Assuming TaskList will be adapted
import { QuoteSummary } from './QuoteSummary'; // Assuming QuoteSummary can take calculated values
import type { FormApi } from '@tanstack/react-form'; // Import FormApi type
// import { CustomerDisplay } from '~/components/customers/CustomerDisplay'; // Placeholder for displaying customer

// Define types based on tRPC router (adapt as needed for form state)
// Using NonNullable to ensure quoteData exists when mapping
type QuoteData = NonNullable<RouterOutputs['quote']['getById']>;
type QuoteUpdateInput = RouterInputs['quote']['update'];

// Revert back to the manually defined interface
export interface QuoteDetailFormValues {
  id: string; // Keep ID as part of the form state
  title: string;
  customerId: string;
  notes?: string | null;
  tasks: Array<{ 
    id?: string; 
    description: string;
    price: number;
    materialType: 'lumpsum' | 'itemized';
    estimatedMaterialsCostLumpSum?: number | null;
    materials: Array<{ 
      id?: string; 
      quantity: number;
      unitPrice: number;
      productId?: string | null;
      notes?: string | null;
    }>;
  }>;
  markupPercentage: number;
}

// --- Zod Schemas for Validation --- 

const materialSchema = z.object({
  id: z.string().optional(),
  quantity: z.number()
    .positive('Quantity must be positive')
    .int('Quantity must be a whole number'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  productId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const taskSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Task description is required'),
  price: z.number().positive('Task price must be positive'),
  materialType: z.enum(['lumpsum', 'itemized']),
  estimatedMaterialsCostLumpSum: z.number().min(0, 'Lump sum cost cannot be negative').nullable().optional(),
  materials: z.array(materialSchema),
}).refine(data => {
  // If materialType is 'lumpsum', estimatedMaterialsCostLumpSum should be provided (or 0)
  if (data.materialType === 'lumpsum') {
    return data.estimatedMaterialsCostLumpSum !== null && data.estimatedMaterialsCostLumpSum !== undefined;
  }
  return true;
}, {
  message: "Lump sum cost estimate is required when Material Type is 'Lump Sum'",
  path: ["estimatedMaterialsCostLumpSum"], // Path to the field this error belongs to
}).refine(data => {
   // If materialType is 'itemized', materials array should not be empty (or you might allow empty)
  if (data.materialType === 'itemized') {
     // Decide if an empty materials array is valid for itemized tasks
     // return data.materials.length > 0;
     return true; // Allowing empty materials array for now
  }
  return true;
}, {
  // message: "At least one material is required when Material Type is 'Itemized'",
  // path: ["materials"],
});


// Main schema mirroring QuoteDetailFormValues (including id)
const quoteDetailSchema = z.object({
  id: z.string(), // Add ID back
  title: z.string().min(1, 'Title is required'),
  customerId: z.string(), // Keep customerId validation if needed
  notes: z.string().nullable().optional(),
  tasks: z.array(taskSchema), // Keep as non-optional array
  markupPercentage: z.number()
    .min(0, 'Markup must be non-negative')
    .max(100, 'Markup cannot exceed 100%'), // Keep as required number
});

// --- End Zod Schemas --- 

interface QuoteDetailModalProps {
  quoteId: string | null; // Expect a non-null ID when editing
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: (updatedQuote: QuoteData) => void; // Optional callback after successful save
}

export const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({
  quoteId,
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();
  const toast = useToastStore();
  const utils = api.useUtils(); // Get tRPC utils

  // Fetch quote data for editing
  const { data: quoteData, isLoading: isLoadingQuote, isError } = api.quote.getById.useQuery(
    { id: quoteId! }, // Use ! asserting quoteId is non-null when modal is open for edit
    {
       enabled: !!quoteId && isOpen, // Only fetch if quoteId is provided and modal is open
       staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
       refetchOnWindowFocus: false, // Don't refetch just on focus
    }
  );

  // tRPC Mutation for updating the quote
  const updateQuoteMutation = api.quote.update.useMutation({
    onSuccess: (updatedQuoteData) => {
      toast.success(t('quotes.updateSuccessToast'));
      // Invalidate relevant queries (e.g., quote list)
      utils.quote.getAll.invalidate(); // Uncommented
      if (onSaveSuccess && updatedQuoteData) {
        onSaveSuccess(updatedQuoteData);
      }
      onClose(); // Close modal on success
    },
    onError: (error) => {
      toast.error(`${t('quotes.updateErrorToast')}: ${error.message}`);
    },
  });

  // Helper function returns QuoteDetailFormValues
  function getInitialFormValues(): QuoteDetailFormValues {
    return {
      id: '', // Include ID
      title: '',
      customerId: '', // Initialize customerId
      notes: null,
      tasks: [],
      markupPercentage: 0,
    };
  }

  // Helper function maps to QuoteDetailFormValues
  function mapQuoteDataToFormValues(data: QuoteData): QuoteDetailFormValues {
      return {
          id: data.id, // Map ID
          title: data.title || '',
          customerId: data.customerId || '',
          notes: data.notes,
          tasks: data.tasks?.map((task: QuoteData['tasks'][number]) => ({ 
              id: task.id,
              description: task.description || '',
              price: Number(task.price) || 0,
              materialType: (task.materialType?.toLowerCase() as 'lumpsum' | 'itemized') || 'lumpsum',
              estimatedMaterialsCostLumpSum: task.estimatedMaterialsCost ? Number(task.estimatedMaterialsCost) : null,
              materials: task.materials?.map((mat: QuoteData['tasks'][number]['materials'][number]) => ({ 
                  id: mat.id,
                  quantity: mat.quantity ?? 1, 
                  unitPrice: Number(mat.unitPrice) || 0, 
                  productId: mat.productId,
                  notes: mat.notes,
              })) || [],
          })) || [],
          markupPercentage: Number(data.markupPercentage) || 0,
      };
  }

    // Helper function accepts QuoteDetailFormValues
    // Returns QuoteUpdateInput (extracts necessary fields)
    function formatFormValuesToApiInput(values: QuoteDetailFormValues, id: string): QuoteUpdateInput {
        const { id: formId, ...dataToUpdate } = values; 
        return {
            id: id, 
            title: dataToUpdate.title,
            notes: dataToUpdate.notes,
            customerId: dataToUpdate.customerId, 
            markupPercentage: dataToUpdate.markupPercentage,
            tasks: dataToUpdate.tasks?.map((task: QuoteDetailFormValues['tasks'][number]) => ({ 
                id: task.id || undefined,
                description: task.description,
                price: task.price, 
                materialType: task.materialType,
                estimatedMaterialsCostLumpSum: task.materialType === 'lumpsum' ? (task.estimatedMaterialsCostLumpSum || null) : undefined,
                materials: task.materialType === 'itemized' ? task.materials?.map((mat: QuoteDetailFormValues['tasks'][number]['materials'][number]) => ({ 
                    id: mat.id || undefined, 
                    quantity: mat.quantity, 
                    unitPrice: mat.unitPrice, 
                    productId: mat.productId || null,
                    notes: mat.notes || null, 
                })) : undefined,
            })) || [], 
        };
    }

  // Remove explicit generic type from useForm
  const form = useForm({
    defaultValues: getInitialFormValues(),
    onSubmit: async ({ value }: { value: QuoteDetailFormValues }) => {
      const result = quoteDetailSchema.safeParse(value);
      if (!result.success) {
         console.error("Form validation failed on submit:", result.error.flatten());
         toast.error(t('common.validationErrorToast', { defaultValue: 'Please fix validation errors.' }));
         return;
      }
      
      if (!quoteId) return;
      
      const updatePayload = formatFormValuesToApiInput(result.data, quoteId);
      await updateQuoteMutation.mutateAsync(updatePayload);
    },
    validators: {
      onChange: quoteDetailSchema
    },
  });

   // Effect to load fetched data into the form once available
   useEffect(() => {
    if (quoteData && !isLoadingQuote) {
      form.reset(mapQuoteDataToFormValues(quoteData));
    }
   }, [quoteData, isLoadingQuote, form]);

  // Calculate derived values
  const { subtotalTasks, subtotalMaterials, markupCharge, tax, grandTotal } = useMemo(() => {
    return calculateQuoteTotals(form.state.values);
  }, [form.state.values]);

  // Handle markup changes
  const handleMarkupChange = (value: number) => {
    form.setFieldValue('markupPercentage', value);
  };

  // Render loading or error state before form is ready
  if (isOpen && isLoadingQuote) {
     return (
       <Modal size="5xl" isOpen={isOpen} onClose={onClose}>
         <ModalContent>
           <ModalHeader>{t('common.loading')}</ModalHeader>
           <ModalBody><Spinner label={t('common.loading')} /></ModalBody>
           <ModalFooter>
             <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
           </ModalFooter>
         </ModalContent>
       </Modal>
     );
   }

   if (isOpen && isError) {
       return (
       <Modal size="md" isOpen={isOpen} onClose={onClose}>
         <ModalContent>
           <ModalHeader>{t('common.error')}</ModalHeader>
           <ModalBody><p>{t('quotes.loadError')}</p></ModalBody>
           <ModalFooter>
             <Button variant="ghost" onClick={onClose}>{t('common.close')}</Button>
           </ModalFooter>
         </ModalContent>
       </Modal>
     );
   }

   // Only render the main modal content when not loading and no error
   if (!isOpen || !quoteData) {
       return null; // Or some placeholder if needed when closed but maybe pre-rendering
   }


  return (
    <Modal size="5xl" isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
      <ModalContent>
        {/* Using form.Provider might be needed if child components access form state directly -> Removed */}
        {/* <form.Provider> */}
          <ModalHeader>{t('quotes.editModalTitle')} {`(#${quoteData.sequentialId})`}</ModalHeader>
          <ModalBody>
              <form
                id="quote-detail-form" // Give form an ID
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void form.handleSubmit(); // Use void if not awaiting inside UI handler
                }}
              >
                {/* --- Basic Info --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <form.Field
                    name="title"
                    children={(field) => ( 
                      <div>
                        <Input
                          label={t('quotes.titleLabel')}
                          placeholder={t('quotes.titlePlaceholder')}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          // Add aria-invalid and aria-describedby for accessibility
                          aria-invalid={!!field.state.meta.errors.length}
                          aria-describedby={field.state.meta.errors.length ? `${field.name}-errors` : undefined}
                        />
                        {/* Error message area */}
                        <div id={`${field.name}-errors`} aria-live="polite">
                          {field.state.meta.errors ? (<em className="text-red-500 text-sm">{field.state.meta.errors.join(', ')}</em>) : null}
                        </div>
                      </div>
                    )}
                  />
                  {/* Display Customer Info (Read Only) */}
                  {/* {quoteData.customer && <CustomerDisplay customer={quoteData.customer} />} */}
                </div>
                 <form.Field
                    name="notes"
                    children={(field) => ( 
                      <div className="mb-4">
                        <Textarea
                           label={t('quotes.notesLabel')}
                           placeholder={t('quotes.notesPlaceholder')}
                           name={field.name}
                           value={field.state.value ?? ''}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           rows={3}
                           // Add aria-invalid and aria-describedby for accessibility
                           aria-invalid={!!field.state.meta.errors.length}
                           aria-describedby={field.state.meta.errors.length ? `${field.name}-errors` : undefined}
                        />
                        {/* Error message area */}
                        <div id={`${field.name}-errors`} aria-live="polite">
                          {field.state.meta.errors ? (<em className="text-red-500 text-sm">{field.state.meta.errors.join(', ')}</em>) : null}
                        </div>
                      </div>
                    )}
                  />

                {/* --- Task List --- */}
                <h3 className="text-lg font-semibold mb-2">{t('quotes.tasksSectionTitle')}</h3>
                
                <form.Field
                  name="tasks"
                  mode="array"
                  children={(field) => (
                    <>
                      <TaskList 
                        form={form}
                        field={field}
                        readOnly={updateQuoteMutation.isPending}
                      />
                      <Button 
                        type="button" 
                        onClick={() => field.pushValue({
                          id: undefined, // New tasks don't have an ID yet
                          description: '', 
                          price: 0, 
                          materialType: 'itemized', 
                          estimatedMaterialsCostLumpSum: null,
                          materials: [] 
                        })} 
                        className="mt-2"
                      >
                        {t('quotes.addTaskButton')}
                      </Button>
                    </>
                  )}
                />
                
                {/* <p className="text-red-500 italic">TaskList component needs adaptation for TanStack Form</p> */}
                {/* Removed old placeholder button */}

                <hr className="my-6" />

                {/* --- Charges & Summary --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
                  <div className="md:col-span-3"> {/* Make summary span full width */} 
                     <QuoteSummary 
                       subtotalTasks={subtotalTasks}
                       subtotalMaterials={subtotalMaterials}
                       markupPercentage={form.state.values.markupPercentage}
                       markupCharge={markupCharge}
                       tax={tax}
                       grandTotal={grandTotal}
                       onMarkupChange={handleMarkupChange}
                       readOnly={updateQuoteMutation.isPending} 
                     />
                  </div>
                </div>
              </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
            <form.Subscribe
               selector={(state) => [state.canSubmit, state.isSubmitting]}
               children={([canSubmit, isSubmitting]) => (
                  <Button
                      color="primary"
                      type="submit" // Trigger the form submission
                      form="quote-detail-form" // Associate with the form
                      isLoading={isSubmitting || updateQuoteMutation.isPending} // Use isPending
                      // Disable if form cannot submit OR if mutation is running
                      disabled={!canSubmit || isSubmitting || updateQuoteMutation.isPending} // Use isPending
                  >
                      {t('common.save')}
                  </Button>
               )}
            />
          </ModalFooter>
        {/* </form.Provider> */}
      </ModalContent>
    </Modal>
  );
};

// Placeholder for CustomerDisplay component if it doesn't exist
/*
const CustomerDisplay = ({ customer }: { customer: NonNullable<QuoteData['customer']> }) => {
   if (!customer) return null;
   return (
     <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
       <p className="font-semibold">{customer.name}</p>
       {customer.email && <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>}
       {customer.phone && <p className="text-sm text-gray-600 dark:text-gray-400">{customer.phone}</p>}
     </div>
   );
};
*/ 

// Helper function to calculate totals based on form values
function calculateQuoteTotals(currentValues: QuoteDetailFormValues) {
  let tasksTotal = 0;
  let materialsTotal = 0;

  currentValues.tasks?.forEach(task => {
    tasksTotal += Number(task.price) || 0;
    if (task.materialType === 'lumpsum') {
      materialsTotal += Number(task.estimatedMaterialsCostLumpSum) || 0;
    } else {
      task.materials?.forEach(material => {
        materialsTotal += (Number(material.quantity) || 0) * (Number(material.unitPrice) || 0);
      });
    }
  });

  const combinedSubtotal = tasksTotal + materialsTotal;
  // Use currentValues for markup percentage
  const markup = combinedSubtotal * (Number(currentValues.markupPercentage) || 0) / 100;
  // Removed complexity calculation
  // Assume tax is applied to subtotal + markup
  const calculatedTax = (combinedSubtotal + markup) * 0.07; // Apply tax after markup
  const total = combinedSubtotal + markup + calculatedTax;

  return {
    subtotalTasks: tasksTotal,
    subtotalMaterials: materialsTotal,
    markupCharge: markup, // Return calculated markup
    tax: calculatedTax,
    grandTotal: total,
  };
} 