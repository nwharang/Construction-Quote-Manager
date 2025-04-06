'use client';

import React from 'react';
import {
  useFormContext, // Can be useful if deep nesting becomes complex, but let's pass props for now
  useFieldArray,
  Controller,
} from 'react-hook-form';
import type {
  Control,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from 'react-hook-form';
import {
  Button,
  Input,
  RadioGroup,
  Radio,
  Textarea,
  Divider,
} from '@heroui/react';
import { Trash, PlusCircle } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';
import { CurrencyInput } from '~/components/ui/CurrencyInput';
import { IntegerInput } from '~/components/ui/IntegerInput';
import { ProductSelector } from '~/components/products/ProductSelector';
import type { QuoteFormValues, TaskFormValues, MaterialFormValues } from './QuoteForm';
import type { Product } from '~/types/product'; // Assuming Product type exists

interface TaskDetailViewProps {
  control: Control<QuoteFormValues>;
  register: UseFormRegister<QuoteFormValues>;
  setValue: UseFormSetValue<QuoteFormValues>;
  watch: UseFormWatch<QuoteFormValues>;
  taskIndex: number;
  errors: FieldErrors<QuoteFormValues>;
  removeTask: () => void;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  control,
  register,
  setValue,
  watch,
  taskIndex,
  errors,
  removeTask,
}) => {
  const { t } = useTranslation();

  // Watch the material type for conditional rendering
  const materialType = watch(`tasks.${taskIndex}.materialType`);

  // Nested Field Array for Materials
  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({
    control,
    name: `tasks.${taskIndex}.materials`,
  });

  const taskErrors = errors.tasks?.[taskIndex];

  const handleProductSelection = (materialIndex: number, product: Product | null) => {
    if (product) {
      setValue(`tasks.${taskIndex}.materials.${materialIndex}.productId`, product.id, { shouldValidate: true });
      // Product price is a string, parse it to number for the form field
      const unitPrice = parseFloat(product.price); // Directly parse the string price
      setValue(`tasks.${taskIndex}.materials.${materialIndex}.unitPrice`, isNaN(unitPrice) ? 0 : unitPrice, { shouldValidate: true }); 
    } else {
      setValue(`tasks.${taskIndex}.materials.${materialIndex}.productId`, null);
      setValue(`tasks.${taskIndex}.materials.${materialIndex}.unitPrice`, 0);
    }
  };

  const handleAddMaterial = () => {
    const newMaterial: MaterialFormValues = {
      // id: undefined, // No client-side ID needed for RHF append
      productId: null,
      quantity: 1,
      unitPrice: 0,
      notes: null,
    };
    appendMaterial(newMaterial);
  };

  return (
    <div className="space-y-6 rounded-md border border-gray-200 p-4 dark:border-gray-700">
      {/* Task Description */}
      <Input
        label={t('quotes.taskDescriptionLabel')}
        placeholder={t('quotes.taskDescriptionPlaceholder')}
        {...register(`tasks.${taskIndex}.description`)}
        errorMessage={taskErrors?.description?.message}
        isInvalid={!!taskErrors?.description}
        isRequired
        classNames={{ input: 'py-3 text-base' }}
      />

      {/* Task Price (Labor) */}
      <Controller
        name={`tasks.${taskIndex}.price`}
        control={control}
        render={({ field: { onChange, value, ...fieldProps } }) => (
          <CurrencyInput
            label={t('quotes.taskPriceLabel')}
            value={value ?? 0}
            onChange={(e) => {
                const targetValue = typeof e === 'object' && e !== null && 'target' in e ? e.target.value : e;
                const numValue = typeof targetValue === 'number' ? targetValue : parseFloat(targetValue || '0');
                onChange(isNaN(numValue) ? 0 : numValue);
            }}
            errorMessage={taskErrors?.price?.message}
            isInvalid={!!taskErrors?.price}
            min={0}
            isRequired
            {...fieldProps}
          />
        )}
      />

      {/* Material Type Toggle */}
      <Controller
        name={`tasks.${taskIndex}.materialType`}
        control={control}
        render={({ field }) => (
          <RadioGroup
            label={t('quotes.materialTypeLabel')}
            orientation="horizontal"
            value={field.value}
            onValueChange={field.onChange}
            errorMessage={taskErrors?.materialType?.message}
            isInvalid={!!taskErrors?.materialType}
            isRequired
            className="mt-1"
          >
            <Radio 
                value="ITEMIZED" 
                className="h-12 text-base block data-[selected=true]:text-primary dark:text-foreground"
            >
                {t('quotes.materialTypeItemized')}
            </Radio>
            <Radio 
                value="LUMPSUM" 
                className="h-12 text-base block data-[selected=true]:text-primary dark:text-foreground"
            >
                {t('quotes.materialTypeLumpSum')}
            </Radio>
          </RadioGroup>
        )}
      />

      {/* Conditional Fields based on Material Type */}
      {materialType === 'LUMPSUM' ? (
        // Lump Sum Cost Input
        <Controller
          name={`tasks.${taskIndex}.estimatedMaterialsCostLumpSum`}
          control={control}
          render={({ field: { onChange, value, ...fieldProps } }) => (
            <CurrencyInput
              label={t('quotes.estimatedMaterialCostLumpSumLabel')}
              value={value ?? 0} // Ensure value is not null/undefined
              onChange={(e) => {
                  const targetValue = typeof e === 'object' && e !== null && 'target' in e ? e.target.value : e;
                  const numValue = typeof targetValue === 'number' ? targetValue : parseFloat(targetValue || '0');
                  onChange(isNaN(numValue) ? null : numValue); // Allow null for optional field
              }}
              errorMessage={taskErrors?.estimatedMaterialsCostLumpSum?.message}
              isInvalid={!!taskErrors?.estimatedMaterialsCostLumpSum}
              min={0}
              // Not strictly required if it can be null
              {...fieldProps}
            />
          )}
        />
      ) : (
        // Itemized Materials List
        <div className="space-y-6 border-t border-gray-200 pt-6 dark:border-gray-700">
          <h4 className="text-md font-semibold">
            {t('quotes.materialsSectionTitle')} {/* Add this key */}
          </h4>
          {materialFields.length === 0 && (
             <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                 {t('quotes.noMaterialsForItemized')} {/* Add key */}
            </p>
          )}
          {materialFields.map((material, materialIndex) => {
              const materialErrors = taskErrors?.materials?.[materialIndex];
              return (
                <div 
                    key={material.id} // useFieldArray provides stable key
                    className="space-y-3 rounded-md border border-gray-200 p-3 dark:border-gray-600"
                 > 
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {/* Product Selector */}
                        <div className="flex-1">
                            <Controller
                                name={`tasks.${taskIndex}.materials.${materialIndex}.productId`}
                                control={control}
                                render={({ field }) => (
                                    <ProductSelector
                                        label={t('quotes.materialProductIdLabel')}
                                        value={field.value}
                                        onChange={(selectedProduct) => handleProductSelection(materialIndex, selectedProduct as Product | null)}
                                        // Pass error state down if needed
                                        // errorMessage={materialErrors?.productId?.message} // Prop likely not supported
                                        // isInvalid={!!materialErrors?.productId} // Prop likely not supported
                                        // TODO: Add custom error styling based on materialErrors?.productId
                                    />
                                )}
                             />
                        </div>
                        {/* Quantity */}
                        <div className="w-full sm:w-24">
                            <Controller
                                name={`tasks.${taskIndex}.materials.${materialIndex}.quantity`}
                                control={control}
                                render={({ field: { onChange, value, ...fieldProps } }) => (
                                    <IntegerInput
                                        label={t('quotes.materialQuantityLabel')}
                                        value={value ?? 1}
                                        onChange={(e) => {
                                            const targetValue = typeof e === 'object' && e !== null && 'target' in e ? e.target.value : e;
                                            const numValue = typeof targetValue === 'number' ? targetValue : parseInt(targetValue || '1');
                                            onChange(isNaN(numValue) ? 1 : numValue);
                                        }}
                                        errorMessage={materialErrors?.quantity?.message}
                                        isInvalid={!!materialErrors?.quantity}
                                        min={1}
                                        isRequired
                                        classNames={{ input: 'py-2 text-sm' }}
                                        {...fieldProps}
                                    />
                                )}
                             />
                        </div>
                        {/* Unit Price */}
                        <div className="w-full sm:w-32">
                            <Controller
                                name={`tasks.${taskIndex}.materials.${materialIndex}.unitPrice`}
                                control={control}
                                render={({ field: { onChange, value, ...fieldProps } }) => (
                                    <CurrencyInput
                                        label={t('quotes.materialUnitPriceLabel')}
                                        value={value ?? 0}
                                        onChange={(e) => {
                                            const targetValue = typeof e === 'object' && e !== null && 'target' in e ? e.target.value : e;
                                            const numValue = typeof targetValue === 'number' ? targetValue : parseFloat(targetValue || '0');
                                            onChange(isNaN(numValue) ? 0 : numValue);
                                        }}
                                        errorMessage={materialErrors?.unitPrice?.message}
                                        isInvalid={!!materialErrors?.unitPrice}
                                        min={0}
                                        isRequired
                                        classNames={{ input: 'py-2 text-sm' }}
                                        {...fieldProps}
                                    />
                                )}
                             />
                        </div>
                    </div>

                    {/* Notes */}
                    <Textarea
                        label={t('quotes.materialNotesHeader')} // Use more appropriate key if available
                        placeholder="Enter any notes about this material..." // Placeholder
                        {...register(`tasks.${taskIndex}.materials.${materialIndex}.notes`)}
                        errorMessage={materialErrors?.notes?.message}
                        isInvalid={!!materialErrors?.notes}
                        minRows={2}
                        classNames={{ input: 'text-sm' }}
                    />

                    {/* Delete Material Button */}
                     <div className="flex justify-end">
                        <Button
                            variant="light"
                            color="danger"
                            size="sm"
                            startContent={<Trash size={16} />}
                            onPress={() => removeMaterial(materialIndex)}
                        >
                            {t('quotes.deleteMaterialButton')} {/* Placeholder */}
                        </Button>
                     </div>
                 </div>
              );
            })}

          {/* Add Material Button */}
          <Button
            fullWidth
            variant="bordered"
            startContent={<PlusCircle size={16} />}
            onPress={handleAddMaterial}
            className="mt-4"
          >
            {t('quotes.addMaterialButton')}
          </Button>
        </div>
      )}

      {/* Delete Task Button */}
      <Divider className="my-6" />
      <div className="flex justify-end">
        <Button
            variant="light"
            color="danger"
            startContent={<Trash size={16} />}
            onPress={removeTask} // removeTask is passed from QuoteForm
        >
            {t('common.delete')} {/* Placeholder - using common.delete */}
        </Button>
      </div>
    </div>
  );
}; 