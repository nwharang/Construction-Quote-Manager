'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  Textarea,
  Spinner,
  Divider,
  SelectItem,
} from '@heroui/react';
import { PlusCircle, ArrowLeft, Save, LayoutList, Edit } from 'lucide-react';
import { api } from '~/utils/api';
import { type QuoteStatusType, QuoteStatus } from '~/server/db/schema';
import { QuoteStatusSettings } from './QuoteStatusBadge';
import { CustomerSelector } from '../customers/CustomerSelector';
import { useTranslation } from '~/hooks/useTranslation';
import { PercentageInput } from '../ui/PercentageInput';
import { QuoteSummary } from './QuoteSummary';
import { TaskMasterList } from './TaskMasterList';
import type { TaskItem } from './TaskMasterList';
import { TaskDetailView } from './TaskDetailView';
import { useAppToast } from '~/components/providers/ToastProvider';

// --- Zod Schema Definition ---
const materialSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid().nullable(),
  productName: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Price must be non-negative'),
  notes: z.string().nullable(),
});

const taskSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, 'Task description is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  materialType: z.enum(['ITEMIZED', 'LUMPSUM']).default('ITEMIZED'),
  estimatedMaterialsCostLumpSum: z.number().min(0).nullable(),
  materials: z.array(materialSchema).optional(),
  // order: z.number().optional(), // Order might be handled separately or implicitly
});

export type MaterialFormValues = z.infer<typeof materialSchema>;
export type TaskFormValues = z.infer<typeof taskSchema>;

const quoteFormSchema = z.object({
  id: z.string().uuid().optional(), // For edit mode
  title: z.string().min(1, 'Quote title is required'),
  customerId: z.string().uuid('Customer is required'),
  markupPercentage: z.number().min(0, 'Markup must be non-negative').default(0),
  notes: z.string().nullable(),
  tasks: z.array(taskSchema).default([]),
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;


// --- Prop Types ---
interface QuoteFormProps {
  initialValues?: Partial<QuoteFormValues>; // Make tasks optional here for creation
  onSubmit: SubmitHandler<QuoteFormValues>;
  isSubmitting: boolean;
  quoteId?: string; // Pass quoteId explicitly if needed, though it's in initialValues for edit
}

export function QuoteForm({ initialValues, onSubmit, isSubmitting, quoteId }: QuoteFormProps) {
  const { t } = useTranslation();
  const { success: showSuccessToast, error: showErrorToast } = useAppToast();

  // --- RHF Setup ---
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: initialValues ? initialValues : {
      title: '',
      customerId: '',
      markupPercentage: 0,
      notes: '',
      tasks: [],
    },
    mode: 'onChange', // Validate on change for better UX
  });

  const { fields: taskFields, append: appendTask, remove: removeTask, move: moveTask } = useFieldArray({
    control,
    name: 'tasks',
  });

  // --- State for Master-Detail View ---
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);

  const handleSelectTask = (index: number) => {
    setSelectedTaskIndex(index);
  };

  const handleAddTask = () => {
    const newTask: TaskFormValues = {
      description: '',
      price: 0,
      materialType: 'ITEMIZED',
      estimatedMaterialsCostLumpSum: null,
      materials: [],
      // Generate a temporary client-side ID if needed for keys, but RHF handles array indices
    };
    appendTask(newTask);
    // Automatically select the new task for editing
    setSelectedTaskIndex(taskFields.length); // New task will be at the end
  };

  const handleGoBackToList = () => {
    setSelectedTaskIndex(null);
  };

  const handleSaveAndCloseTask = () => {
     // Potentially add validation check here before closing
     setSelectedTaskIndex(null);
  };

   const handleDeleteTask = (index: number) => {
    // Add confirmation dialog logic here if needed
    if (confirm('Are you sure you want to delete this task?')) { // Placeholder confirm
        removeTask(index);
        // If the deleted task was selected, go back to the list
        if (selectedTaskIndex === index) {
            setSelectedTaskIndex(null);
        } else if (selectedTaskIndex !== null && index < selectedTaskIndex) {
             // Adjust selected index if an earlier task was removed
            setSelectedTaskIndex(selectedTaskIndex - 1);
        }
        showSuccessToast('Task deleted'); // Call the destructured function
    }
  };

  // Watch tasks array for summary calculation
  const watchedTasks = watch('tasks');
  const watchedMarkup = watch('markupPercentage');

  // Reset form if initialValues change (e.g., navigating between new/edit)
  useEffect(() => {
    if (initialValues) {
       // Deep compare or use a version/timestamp if needed for complex scenarios
       // For simplicity, resetting based on quoteId presence change
      reset({
        title: '',
        customerId: '',
        markupPercentage: 0,
        notes: '',
        tasks: [],
        ...initialValues
      });
      setSelectedTaskIndex(null); // Reset selection on form reset
    }
  }, [initialValues, reset]);

  // Map taskFields from RHF to TaskItem array expected by TaskMasterList
  const watchedTasksData = watch('tasks'); // Watch the whole tasks array for rendering the list
  const mappedTaskItems: TaskItem[] = taskFields.map((field, index) => {
     const taskData = watchedTasksData[index];
     return {
        // Include all fields from TaskFormValues:
        description: taskData?.description || '',
        price: taskData?.price ?? 0,
        materialType: taskData?.materialType || 'ITEMIZED', // Default if somehow missing
        estimatedMaterialsCostLumpSum: taskData?.estimatedMaterialsCostLumpSum ?? null,
        materials: taskData?.materials || [], // Include materials array
        // Plus the ID from useFieldArray:
        id: field.id, // RHF's stable ID
        // 'order' was incorrectly added before, it's not part of TaskItem
     };
  }); // No need for 'as TaskItem' assertion now

  // --- Render Logic ---
  const isDetailViewVisible = selectedTaskIndex !== null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* --- Top Quote Details --- */}
      <Card>
        <CardBody className="p-6 space-y-6">
          <h2 className="text-xl font-semibold mb-4">{t('quotes.detailsSectionTitle')}</h2>
          {/* Title */}
          <div>
            <Input
              label={t('quotes.fields.title')}
              placeholder={t('quotes.placeholders.title')}
              {...register('title')}
              disabled={isSubmitting}
              errorMessage={errors.title?.message}
              isInvalid={!!errors.title}
            />
          </div>

          {/* Customer Selector */}
          <div>
             <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <CustomerSelector
                  label={t('quotes.fields.customer')}
                  placeholder={t('quotes.placeholders.selectCustomer')}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  errorMessage={errors.customerId?.message}
                  isInvalid={!!errors.customerId}
                />
              )}
            />
          </div>

          {/* Markup Percentage */}
           <div>
             <Controller
                name="markupPercentage"
                control={control}
                render={({ field: { onChange, value, ...fieldProps } }) => (
                    <PercentageInput
                        label={t('quoteSummary.markupInputLabel')}
                        value={value ?? 0}
                        onChange={(e) => {
                             const targetValue = typeof e === 'object' && e !== null && 'target' in e ? e.target.value : e;
                             const numValue = typeof targetValue === 'number' ? targetValue : parseFloat(targetValue || '0');
                             onChange(isNaN(numValue) ? 0 : numValue);
                        }}
                        disabled={isSubmitting}
                        errorMessage={errors.markupPercentage?.message}
                        isInvalid={!!errors.markupPercentage}
                        min={0}
                        {...fieldProps}
                    />
                )}
            />
          </div>

          {/* Notes */}
          <div>
            <Textarea
              label={t('quotes.notesLabel')}
              placeholder={t('quotes.placeholders.notes')}
              {...register('notes')}
              disabled={isSubmitting}
              errorMessage={errors.notes?.message}
              isInvalid={!!errors.notes}
              minRows={3}
            />
          </div>
        </CardBody>
      </Card>

      {/* --- Tasks & Materials Section (Master/Detail) --- */}
      <Card>
         <CardBody className="p-6">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t('quotes.tasksSectionTitle')}</h2>
                 {isDetailViewVisible && (
                    <Button
                        variant="light"
                        color="secondary"
                        size="sm"
                        startContent={<ArrowLeft size={16} />}
                        onClick={handleGoBackToList}
                        aria-label={t('common.back')}
                    >
                       {t('common.back')}
                    </Button>
                 )}
             </div>

             {/* Conditional Rendering for Master-Detail */}
             {isDetailViewVisible && selectedTaskIndex !== null ? (
                // --- Task Detail View ---
                <TaskDetailView
                    control={control}
                    register={register}
                    setValue={setValue}
                    watch={watch}
                    taskIndex={selectedTaskIndex}
                    errors={errors}
                    removeTask={() => handleDeleteTask(selectedTaskIndex)} // Pass the specific index to delete
                />
             ) : (
                 // --- Task Master List ---
                 <TaskMasterList
                    tasks={mappedTaskItems} // Pass the mapped items
                    onAddTask={handleAddTask}
                    onSelectTask={handleSelectTask}
                    onDeleteTask={handleDeleteTask}
                    // onMoveTask={moveTask} // Add move later if needed - Requires dnd-kit setup
                 />
             )}
         </CardBody>
      </Card>


      {/* --- Quote Summary --- */}
      <QuoteSummary tasks={watchedTasks} markupPercentage={watchedMarkup ?? 0} />

      {/* --- Form Actions --- */}
      <div className="mt-8 flex justify-end space-x-4">
        {/* <Button variant="bordered" onPress={() => reset()} disabled={isSubmitting || !isDirty}>Reset</Button> */}
        <Button
          type="submit"
          color="primary"
          isLoading={isSubmitting}
          isDisabled={!isValid || !isDirty} // Only enable if valid and changed
          className="min-w-[120px]"
        >
          {t('common.save')} {/* Use translation key */}
        </Button>
      </div>
    </form>
  );
}

// Helper to convert form data before sending to API if needed
// (e.g., converting numbers to strings if backend expects decimals as strings)
// Not strictly needed if Zod schema matches API schema and service layer handles conversion
// export const transformFormDataForApi = (data: QuoteFormValues): ApiQuoteInput => { ... }
