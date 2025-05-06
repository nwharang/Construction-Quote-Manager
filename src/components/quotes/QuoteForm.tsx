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
  Textarea,
  Drawer,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerContent,
} from '@heroui/react';
import { PlusCircle, ArrowLeft, Save, LayoutList, Edit, X, Trash } from 'lucide-react';
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
    getValues,
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema) as any,
    defaultValues: initialValues
      ? initialValues
      : {
          title: '',
          customerId: '',
          markupPercentage: 0,
          notes: '',
          tasks: [],
        },
    mode: 'onChange', // Validate on change for better UX
  });

  const {
    fields: taskFields,
    append: appendTask,
    remove: removeTask,
    move: moveTask,
  } = useFieldArray({
    control,
    name: 'tasks',
  });

  // --- State for Drawer and Task Management ---
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Update handlers to manage drawer state
  const handleSelectTask = (index: number) => {
    setSelectedTaskIndex(index);
    setIsDrawerOpen(true);
  };

  const handleAddTask = () => {
    const newTask: TaskFormValues = {
      description: '',
      price: 0,
      materialType: 'ITEMIZED',
      estimatedMaterialsCostLumpSum: null,
      materials: [],
    };
    appendTask(newTask);
    // Automatically select the new task for editing
    setSelectedTaskIndex(taskFields.length); // New task will be at the end
    setIsDrawerOpen(true);
  };

  const handleGoBackToList = () => {
    setIsDrawerOpen(false);
  };

  const handleTaskDrawerClose = () => {
    setSelectedTaskIndex(null);
    setIsDrawerOpen(false);
  };

  const handleSaveAndCloseTask = () => {
    setIsDrawerOpen(false);
  };

  const handleDeleteTask = (index: number) => {
    // Add confirmation dialog logic here if needed
    if (confirm('Are you sure you want to delete this task?')) {
      // Placeholder confirm
      removeTask(index);
      // If the deleted task was selected, close the drawer
      if (selectedTaskIndex === index) {
        setIsDrawerOpen(false);
      } else if (selectedTaskIndex !== null && index < selectedTaskIndex) {
        // Adjust selected index if an earlier task was removed
        setSelectedTaskIndex(selectedTaskIndex - 1);
      }
      showSuccessToast('Task deleted');
    }
  };

  // Watch tasks array for summary calculation
  const watchedTasks = watch('tasks');

  // Reset form if initialValues change (e.g., navigating between new/edit)
  useEffect(() => {
    if (quoteId) {
      // Deep compare or use a version/timestamp if needed for complex scenarios
      // For simplicity, resetting based on quoteId presence change
      reset({
        title: '',
        customerId: '',
        markupPercentage: 0,
        notes: '',
        tasks: [],
        ...initialValues,
      });
      setSelectedTaskIndex(null); // Reset selection on form reset
      setIsDrawerOpen(false);
    }
  }, [quoteId, reset]);

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
    };
  });

  // Create a variable for the drawer content
  const taskDetailDrawerContent =
    selectedTaskIndex !== null ? (
      <>
        <DrawerHeader>
          <h3 className="text-lg font-bold">
            {watch(`tasks.${selectedTaskIndex}.description`) || 'Edit Task'}
          </h3>
        </DrawerHeader>
        <DrawerBody className="overflow-auto">
          <TaskDetailView
            taskIndex={selectedTaskIndex}
            control={control}
            register={register}
            errors={errors}
            watch={watch}
            getValues={getValues}
            setValue={setValue}
            removeTask={() => handleDeleteTask(selectedTaskIndex)}
          />
        </DrawerBody>
        <DrawerFooter>
          <div className="flex justify-end space-x-3">
            <Button variant="flat" color="default" onPress={handleTaskDrawerClose}>
              {t('common.close')}
            </Button>
          </div>
        </DrawerFooter>
      </>
    ) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* --- Top Quote Details --- */}
      <Card>
        <CardBody className="space-y-6">
          <h2 className="mb-4 text-xl font-semibold">{t('quotes.detailsSectionTitle')}</h2>
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
                  onValueChange={(val) => {
                    if (typeof val === 'number') {
                      onChange(val);
                      return;
                    }

                    const numValue = parseFloat(val || '0');

                    onChange(isNaN(numValue) ? 0 : numValue);
                  }}
                  disabled={isSubmitting}
                  errorMessage={errors.markupPercentage?.message}
                  isInvalid={!!errors.markupPercentage}
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
              minRows={2}
            />
          </div>
        </CardBody>
      </Card>

      {/* --- Tasks & Materials Section --- */}
      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('quotes.tasksSectionTitle')}</h2>
          </div>

          {/* Task Master List */}
          <TaskMasterList
            tasks={mappedTaskItems}
            onAddTask={handleAddTask}
            onSelectTask={handleSelectTask}
            onDeleteTask={handleDeleteTask}
            watch={watch}
          />
        </CardBody>
      </Card>

      {/* Drawer for Task Detail View */}
      <Drawer
        isOpen={selectedTaskIndex !== null}
        onOpenChange={handleTaskDrawerClose}
        placement="right"
        size="md"
        classNames={{
          wrapper: 'z-50',
          base: 'h-full max-w-md',
        }}
        motionProps={{
          variants: {
            enter: {
              x: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: 'easeOut',
              },
            },
            exit: {
              x: 100,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: 'easeIn',
              },
            },
          },
        }}
      >
        <DrawerContent>{taskDetailDrawerContent}</DrawerContent>
      </Drawer>

      {/* --- Quote Summary --- */}
      <QuoteSummary tasks={watchedTasks} markupPercentage={watch('markupPercentage')} />

      {/* --- Form Actions --- */}
      <div className="mt-8 flex justify-end space-x-4">
        <Button
          type="submit"
          color="primary"
          isLoading={isSubmitting}
          isDisabled={!isValid || !isDirty} // Only enable if valid and changed
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
