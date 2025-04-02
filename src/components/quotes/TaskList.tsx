'use client';

import React from 'react';
import { useFieldArray, Controller, type UseFormReturn } from 'react-hook-form';
import {
  Button,
  Input,
  NumberInput,
  RadioGroup,
  Radio, // Import cn utility
} from '@heroui/react';
import { Plus, Trash2 as IconTrash } from 'lucide-react'; // Use consistent icon import
import { useTranslation } from '~/hooks/useTranslation';
import type { QuoteDetailFormValues } from './QuoteDetailModal'; // Assuming types are exported from here
import { ProductSelector } from '~/components/products/ProductSelector';

// Helper Component for Field Errors (assuming it's defined elsewhere or here)
function FieldInfo({ error }: { error?: { message?: string } }) {
  return error?.message ? <p className="text-danger mt-1 text-xs">{error.message}</p> : null;
}

// --- Props Interface --- //
interface TaskListProps {
  form: UseFormReturn<QuoteDetailFormValues>;
  readOnly?: boolean;
}

interface MaterialListProps {
  form: UseFormReturn<QuoteDetailFormValues>;
  taskIndex: number;
  readOnly?: boolean;
}

// --- Main TaskList Component --- //
export const TaskList: React.FC<TaskListProps> = ({ form, readOnly = false }) => {
  const { t, formatCurrency } = useTranslation();
  const { control, watch } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tasks',
  });

  // Get currency symbol
  const currencySymbol = formatCurrency(0)
    .replace(/\d|\.|,/g, '')
    .trim();

  const handleAddTask = () => {
    append({
      description: '',
      price: 0,
      materialType: 'ITEMIZED', // Default to itemized
      estimatedMaterialsCostLumpSum: 0,
      materials: [],
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {t('quotes.tasksSectionTitle')}
      </h3>

      {fields.length === 0 && !readOnly && (
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">
          <p>{t('quotes.noTasksAddedEditable')}</p>
        </div>
      )}
      {fields.length === 0 && readOnly && (
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">
          <p>{t('quotes.noTasksAddedReadOnly')}</p>
        </div>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="relative border-b border-gray-200 py-4 last:border-b-0 dark:border-gray-700"
        >
          {/* Remove Task Button */}
          {!readOnly && (
            <Button
              isIconOnly
              variant="light"
              color="danger"
              size="sm"
              onClick={() => remove(index)}
              className="absolute top-2 right-2 z-10"
              aria-label={t('common.removeTask')}
            >
              <IconTrash size={16} />
            </Button>
          )}

          {/* Task Fields Layout */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
            {/* Description */}
            <div className="md:col-span-6">
              <Controller
                name={`tasks.${index}.description`}
                control={control}
                rules={{ required: t('validation.required') }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Input
                      label={t('quotes.taskDescriptionLabel')}
                      placeholder={t('quotes.taskDescriptionPlaceholder')}
                      isRequired
                      isDisabled={readOnly}
                      isInvalid={!!error}
                      errorMessage={error?.message}
                      className="w-full"
                      {...field}
                    />
                  </>
                )}
              />
            </div>

            {/* Price */}
            <div className="md:col-span-3">
              <Controller
                name={`tasks.${index}.price`}
                control={control}
                rules={{
                  required: t('validation.required'),
                  min: { value: 0, message: t('validation.minValue', { min: 0 }) },
                }}
                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                  <NumberInput
                    label={t('quotes.taskPriceLabel')}
                    value={value ?? 0}
                    onChange={onChange} // react-hook-form handles conversion
                    min={0}
                    step={0.01}
                    formatOptions={{
                      style: 'decimal',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }}
                    startContent={currencySymbol}
                    isRequired
                    isDisabled={readOnly}
                    isInvalid={!!error}
                    errorMessage={error?.message}
                    className="w-full"
                    {...field}
                  />
                )}
              />
            </div>

            {/* Material Type */}
            <div className="md:col-span-3">
              <Controller
                name={`tasks.${index}.materialType`}
                control={control}
                render={({ field: { onChange, value, name } }) => (
                  <RadioGroup
                    name={name}
                    label={t('quotes.materialTypeLabel')}
                    orientation="horizontal"
                    value={value} // Ensure value is controlled
                    onValueChange={onChange} // Ensure onChange updates the form
                    isDisabled={readOnly}
                    className="mt-1"
                  >
                    <Radio value="LUMPSUM">{t('quotes.materialTypeLumpSum')}</Radio>
                    <Radio value="ITEMIZED">{t('quotes.materialTypeItemized')}</Radio>
                  </RadioGroup>
                )}
              />
            </div>
          </div>

          {/* Conditional Fields based on Material Type */}
          <div className="mt-4">
            {watch(`tasks.${index}.materialType`) === 'LUMPSUM' && (
              <Controller
                name={`tasks.${index}.estimatedMaterialsCostLumpSum`}
                control={control}
                rules={{
                  required: t('validation.required'),
                  min: { value: 0, message: t('validation.minValue', { min: 0 }) },
                }}
                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                  <NumberInput
                    label={t('quotes.estimatedMaterialCostLumpSumLabel')}
                    value={value ?? 0}
                    onChange={onChange}
                    min={0}
                    step={0.01}
                    formatOptions={{
                      style: 'decimal',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }}
                    startContent={currencySymbol}
                    isRequired
                    isDisabled={readOnly}
                    className="mb-4 max-w-xs" // Constrain width
                    errorMessage={error?.message}
                    isInvalid={!!error}
                    {...field}
                  />
                )}
              />
            )}

            {watch(`tasks.${index}.materialType`) === 'ITEMIZED' && (
              <div className="mt-4 mb-2 border-l-2 border-gray-200 pl-4 dark:border-gray-600">
                <h4 className="text-md mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  {t('quotes.materialsSectionTitle')}
                </h4>
                <MaterialList form={form} taskIndex={index} readOnly={readOnly} />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add Task Button - moved outside the loop */}
      {!readOnly && (
        <div className="mt-4 flex justify-start border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button
            variant="ghost"
            color="primary"
            startContent={<Plus size={16} />}
            onClick={handleAddTask}
            isDisabled={readOnly}
          >
            {t('quotes.addTaskButton')}
          </Button>
        </div>
      )}
    </div>
  );
};

// --- MaterialList Component (Nested) --- //
const MaterialList: React.FC<MaterialListProps> = ({ form, taskIndex, readOnly = false }) => {
  const { t, formatCurrency } = useTranslation();
  const { control } = form; // Get control from the main form prop
  const { fields, append, remove } = useFieldArray({
    control: control, // Use control from props
    name: `tasks.${taskIndex}.materials`,
  });

  // Get currency symbol for number inputs
  const currencySymbol = formatCurrency(0)
    .replace(/\d|\.|,/g, '')
    .trim();

  const handleAddMaterial = () => {
    append({ productId: '', quantity: 1, unitPrice: 0, notes: '' });
  };

  return (
    <div className="space-y-4">
      {fields.length === 0 && !readOnly && (
        <div className="py-2 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>{t('quotes.noMaterialsAdded')}</p>
        </div>
      )}

      {fields.map((field, materialIndex) => (
        <div
          key={field.id}
          className="relative space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800/50"
        >
          {/* Remove Material Button */}
          {!readOnly && (
            <Button
              isIconOnly={true}
              variant="light"
              color="danger"
              size="sm"
              onClick={() => remove(materialIndex)}
              className="absolute top-1 right-1 z-10"
              aria-label={t('common.removeMaterial')}
            >
              <IconTrash size={16} />
            </Button>
          )}

          {/* Material Fields Layout - Using Grid */}
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-12">
            {/* Product Selector */}
            <div className="sm:col-span-12">
              <Controller
                name={`tasks.${taskIndex}.materials.${materialIndex}.productId`}
                control={control}
                rules={{ required: t('validation.required') }}
                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                  <>
                    <ProductSelector
                      label={t('quotes.materialProductIdLabel')}
                      value={value ?? undefined}
                      onChange={(selectedProduct) => {
                        if (selectedProduct) {
                          onChange(selectedProduct.id);
                          form.setValue(
                            `tasks.${taskIndex}.materials.${materialIndex}.unitPrice`,
                            Number(selectedProduct.unitPrice),
                            { shouldValidate: true }
                          );
                        }
                      }}
                      disabled={readOnly}
                      {...field}
                    />
                    <FieldInfo error={error} />
                  </>
                )}
              />
            </div>

            {/* Quantity */}
            <div className="sm:col-span-6">
              <Controller
                name={`tasks.${taskIndex}.materials.${materialIndex}.quantity`}
                control={control}
                rules={{
                  required: t('validation.required'),
                  min: { value: 1, message: t('validation.minValue', { min: 1 }) },
                }}
                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                  <NumberInput
                    label={t('quotes.materialQuantityLabel')}
                    value={value ?? 1}
                    onChange={onChange}
                    min={1}
                    step={1}
                    formatOptions={{ style: 'decimal', maximumFractionDigits: 0 }}
                    isRequired
                    isDisabled={readOnly}
                    aria-label={t('quotes.materialQuantityLabel')}
                    errorMessage={error?.message}
                    isInvalid={!!error}
                    {...field}
                  />
                )}
              />
            </div>

            {/* Unit Price */}
            <div className="sm:col-span-6">
              <Controller
                name={`tasks.${taskIndex}.materials.${materialIndex}.unitPrice`}
                control={control}
                rules={{
                  required: t('validation.required'),
                  min: { value: 0, message: t('validation.minValue', { min: 0 }) },
                }}
                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                  <NumberInput
                    label={t('quotes.materialUnitPriceLabel')}
                    value={value ?? 0}
                    onChange={onChange}
                    min={0}
                    step={0.01}
                    formatOptions={{
                      style: 'decimal',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }}
                    startContent={currencySymbol}
                    isRequired
                    isDisabled={readOnly}
                    aria-label={t('quotes.materialUnitPriceLabel')}
                    errorMessage={error?.message}
                    isInvalid={!!error}
                    {...field}
                  />
                )}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add Material Button */}
      {!readOnly && (
        <div className="mt-4 flex justify-start">
          <Button
            variant="ghost"
            color="primary"
            size="sm"
            startContent={<Plus size={16} />}
            onPress={handleAddMaterial}
            isDisabled={readOnly}
          >
            {t('quotes.addMaterialButton')}
          </Button>
        </div>
      )}
    </div>
  );
};
