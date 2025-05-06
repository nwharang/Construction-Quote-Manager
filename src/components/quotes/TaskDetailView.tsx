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
import { Button, Input, RadioGroup, Radio, Textarea, Divider } from '@heroui/react';
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
  getValues?: UseFormWatch<QuoteFormValues>;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  control,
  register,
  setValue,
  watch,
  taskIndex,
  errors,
  removeTask,
  getValues,
}) => {
  const { t } = useTranslation();

  // Watch the material type for conditional rendering
  const materialType = watch(`tasks.${taskIndex}.materialType`);

  // Nested Field Array for Materials
  const {
    fields: materialFields,
    append: appendMaterial,
    remove: removeMaterial,
  } = useFieldArray({
    control,
    name: `tasks.${taskIndex}.materials`,
  });

  const taskErrors = errors.tasks?.[taskIndex];

  const handleProductSelection = (materialIndex: number, product: Product | null) => {
    if (product) {
      setValue(`tasks.${taskIndex}.materials.${materialIndex}.productId`, product.id, {
        shouldValidate: true,
      });
      setValue(`tasks.${taskIndex}.materials.${materialIndex}.productName`, product.name, {
        shouldValidate: true,
      });
      // Product price is a string, parse it to number for the form field
      const unitPrice = parseFloat(product.unitPrice); // Directly parse the string price
      setValue(
        `tasks.${taskIndex}.materials.${materialIndex}.unitPrice`,
        isNaN(unitPrice) ? 0 : unitPrice,
        { shouldValidate: true }
      );
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
    <div className="space-y-6">
      {/* Task Description */}
      <Input
        label={t('quotes.taskDescriptionLabel')}
        placeholder={t('quotes.taskDescriptionPlaceholder')}
        {...register(`tasks.${taskIndex}.description`)}
        errorMessage={taskErrors?.description?.message}
        isInvalid={!!taskErrors?.description}
        isRequired
      />

      {/* Task Price (Labor) */}
      <Controller
        name={`tasks.${taskIndex}.price`}
        control={control}
        render={({ field: { onChange, value, ...fieldProps } }) => (
          <CurrencyInput
            label={t('quotes.taskPriceLabel')}
            value={value ?? 0}
            onValueChange={(val) => {
              // Handle value directly if it's a number
              if (typeof val === 'number') {
                onChange(val);
                return;
              }
            }}
            errorMessage={taskErrors?.price?.message}
            isInvalid={!!taskErrors?.price}
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
          >
            <Radio
              value="ITEMIZED"
              className="data-[selected=true]:text-primary dark:text-foreground"
            >
              {t('quotes.materialTypeItemized')}
            </Radio>
            <Radio
              value="LUMPSUM"
              className="data-[selected=true]:text-primary dark:text-foreground"
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
              onValueChange={(val) => {
                // Handle value directly if it's a number
                if (typeof val === 'number') {
                  onChange(val);
                  return;
                }
              }}
              errorMessage={taskErrors?.estimatedMaterialsCostLumpSum?.message}
              isInvalid={!!taskErrors?.estimatedMaterialsCostLumpSum}
              // Not strictly required if it can be null
              {...fieldProps}
            />
          )}
        />
      ) : (
        // Itemized Materials List
        <div className="space-y-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold">{t('quotes.materialsSectionTitle')}</h4>
            <Button
              variant="flat"
              color="primary"
              size="sm"
              startContent={<PlusCircle size={16} />}
              onPress={handleAddMaterial}
            >
              {t('quotes.addMaterialButton')}
            </Button>
          </div>

          {materialFields.length === 0 && (
            <p className="py-2 text-center text-gray-500 dark:text-gray-400">
              {t('quotes.noMaterialsPlaceholder')}
            </p>
          )}

          {materialFields.map((material, materialIndex) => {
            const materialErrors = taskErrors?.materials?.[materialIndex];
            return (
              <div
                key={material.id} // useFieldArray provides stable key
                className="rounded-md border border-gray-200 p-3 dark:border-gray-600"
              >
                <div className="mb-2 flex justify-between">
                  <h5 className="text-sm font-medium">
                    {t('quotes.materialHeading', { index: materialIndex + 1 })}
                  </h5>
                  <Button
                    color="danger"
                    variant="light"
                    size="sm"
                    isIconOnly
                    onPress={() => removeMaterial(materialIndex)}
                  >
                    <Trash size={16} />
                  </Button>
                </div>

                {/* Product Selector */}
                <div className="mb-3">
                  <Controller
                    name={`tasks.${taskIndex}.materials.${materialIndex}.productId`}
                    control={control}
                    render={({ field }) => (
                      <ProductSelector
                        label={t('quotes.productMaterialLabel')}
                        value={field.value}
                        onChange={(selectedProduct) =>
                          handleProductSelection(materialIndex, selectedProduct as Product | null)
                        }
                      />
                    )}
                  />
                </div>

                {/* Quantity and Unit Price on Same Row */}
                <div className="mb-3 grid grid-cols-2 gap-3">
                  {/* Quantity */}
                  <div>
                    <Controller
                      name={`tasks.${taskIndex}.materials.${materialIndex}.quantity`}
                      control={control}
                      render={({ field: { onChange, value, ...fieldProps } }) => (
                        <IntegerInput
                          label={t('quotes.quantityLabel')}
                          value={value}
                          onValueChange={(val) => {
                            // Handle value directly if it's a number
                            if (typeof val === 'number') {
                              onChange(val);
                              return;
                            }
                          }}
                          errorMessage={materialErrors?.quantity?.message}
                          isInvalid={!!materialErrors?.quantity}
                          min={1}
                          isRequired
                          {...fieldProps}
                        />
                      )}
                    />
                  </div>

                  {/* Unit Price */}
                  <div>
                    <Controller
                      name={`tasks.${taskIndex}.materials.${materialIndex}.unitPrice`}
                      control={control}
                      render={({ field: { onChange, value, ...fieldProps } }) => (
                        <CurrencyInput
                          label={t('quotes.unitPriceLabel')}
                          value={value ?? 0}
                          onValueChange={(val) => {
                            // Handle value directly if it's a number
                            if (typeof val === 'number') {
                              onChange(val);
                              return;
                            }
                          }}
                          errorMessage={materialErrors?.unitPrice?.message}
                          isInvalid={!!materialErrors?.unitPrice}
                          isRequired
                          {...fieldProps}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Optional Notes Field */}
                <div>
                  <Textarea
                    label={t('quotes.notesLabel')}
                    placeholder={t('quotes.notesPlaceholder')}
                    {...register(`tasks.${taskIndex}.materials.${materialIndex}.notes`)}
                    errorMessage={materialErrors?.notes?.message}
                    isInvalid={!!materialErrors?.notes}
                    minRows={2}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
