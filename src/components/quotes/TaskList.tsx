import React from 'react';
import { Card, CardBody, CardHeader, Input, NumberInput, Button, RadioGroup, Radio, Textarea, CardFooter } from '@heroui/react';
import { useTranslation } from '~/hooks/useTranslation';
import { type FormApi, type FieldApi } from '@tanstack/react-form'; // Import FormApi and FieldApi
import { type QuoteDetailFormValues } from './QuoteDetailModal'; // Import the form values type
import { formatCurrency } from '~/utils/formatters';
import { IconTrash } from '@tabler/icons-react';
import { ProductSelector } from '~/components/products/ProductSelector';

// Define the props TaskList will receive from the form field array
interface TaskListProps {
  // Revert to any types to resolve complex generic issues for now
  form: any; // Expect the form instance
  field: any; // Expect the field instance for the tasks array
  readOnly?: boolean; // Keep readOnly for disabling inputs
}

export const TaskList: React.FC<TaskListProps> = ({ form, field, readOnly = false }) => {
  const { t } = useTranslation();

  // Actions are handled via field array API (pushValue, removeValue) and nested field handleChange

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row justify-between items-center">
        <h2 className="text-xl font-semibold">{t('quotes.tasksSectionTitle')}</h2>
        {/* Add Task button is rendered below in CardFooter */}
      </CardHeader>

      <CardBody>
        {field.state.value.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
             {t('quotes.noTasksAddedEditable')}
          </div>
        ) : (
          <div className="space-y-6">
            {field.state.value.map((task: QuoteDetailFormValues['tasks'][number], index: number) => (
              <div
                key={field.api.getFieldValue(['tasks', index, 'id']) || index} // Use stable ID if available
                className="p-4 border rounded-md relative"
              >
                {!readOnly && (
                  <Button
                    isIconOnly={true}
                    variant="light"
                    color="danger"
                    size="sm"
                    onClick={() => field.removeValue(index)} // Use removeValue from field API
                    className="absolute top-1 right-1"
                    aria-label={t('common.remove')}
                  >
                    <IconTrash size={18} />
                  </Button>
                )}

                {/* --- Editable Task Fields --- */}
                <form.Field
                  name={`tasks[${index}].description`}
                  form={form}
                  children={(taskField: any) => ( // Explicitly type as any
                    <Textarea // Use Textarea for multiline description
                      label={t('quotes.taskDescriptionLabel')}
                      placeholder={t('quotes.taskDescriptionPlaceholder')}
                      value={taskField.state.value}
                      onChange={(e) => taskField.handleChange(e.target.value)}
                      onBlur={taskField.handleBlur}
                      required
                      isDisabled={readOnly}
                      className="mb-4"
                      // TODO: Display validation errors: {taskField.state.meta.errors ? ... : null}
                    />
                  )}
                />

                <form.Field
                  name={`tasks[${index}].price`}
                  form={form}
                  children={(taskField: any) => ( // Explicitly type as any
                    <NumberInput
                      label={t('quotes.taskPriceLabel')}
                      value={taskField.state.value}
                      onChange={(value) => taskField.handleChange(value ?? 0)} // Handle potential null
                      onBlur={taskField.handleBlur}
                      min={0}
                      step={0.01}
                      formatOptions={{ style: 'currency', currency: 'USD' }} // Use consistent currency formatting
                      isDisabled={readOnly}
                      className="mb-4"
                      // TODO: Display validation errors
                    />
                  )}
                />

                {/* --- Materials Choice --- */}
                 <form.Field
                   name={`tasks[${index}].materialType`}
                   form={form}
                   children={(taskField: any) => ( // Explicitly type as any
                    <RadioGroup
                      label={t('quotes.materialTypeLabel')}
                      orientation="horizontal"
                      value={taskField.state.value}
                      onValueChange={taskField.handleChange} // Use onValueChange for RadioGroup
                      isDisabled={readOnly}
                      className="mb-4"
                    >
                      <Radio value="lumpsum">{t('quotes.materialTypeLumpSum')}</Radio>
                      <Radio value="itemized">{t('quotes.materialTypeItemized')}</Radio>
                    </RadioGroup>
                   )}
                />

                {/* Conditional Editable Fields based on Material Type */}
                {field.state.value[index]?.materialType === 'lumpsum' && (
                  <form.Field
                    name={`tasks[${index}].estimatedMaterialsCostLumpSum`}
                    form={form}
                    children={(taskField: any) => ( // Explicitly type as any
                      <NumberInput
                        label={t('quotes.estimatedMaterialCostLumpSumLabel')}
                        value={taskField.state.value ?? undefined} // Handle null/undefined for NumberInput
                        onChange={(value) => taskField.handleChange(value)} // Allow null
                        onBlur={taskField.handleBlur}
                        min={0}
                        step={0.01}
                        formatOptions={{ style: 'currency', currency: 'USD' }}
                        isDisabled={readOnly}
                        className="mb-4"
                        // TODO: Display validation errors
                      />
                    )}
                  />
                )}

                {field.state.value[index]?.materialType === 'itemized' && (
                  <div className="pl-4 border-l-2 border-gray-200 mt-4 mb-4">
                    <h4 className="text-md font-semibold mb-2">{t('quotes.materialsSectionTitle')}</h4>
                    <form.Field
                      name={`tasks[${index}].materials`}
                      mode="array"
                      form={form}
                      children={(materialsField: any) => ( // Explicitly type as any
                        <div className="space-y-3">
                          {materialsField.state.value?.map((material: any, materialIndex: number) => ( // Type material as any
                            <div key={materialsField.api.getFieldValue(['tasks', index, 'materials', materialIndex, 'id']) || materialIndex} className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-2 border p-3 rounded-md relative">
                              {/* Remove Material Button */}
                              {!readOnly && (
                                <Button
                                  isIconOnly={true} variant="light" color="danger" size="sm"
                                  onClick={() => materialsField.removeValue(materialIndex)}
                                  className="absolute top-1 right-1" aria-label={t('common.remove')}
                                > <IconTrash size={16} /> </Button>
                              )}

                              {/* Material Fields - using form context */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 w-full">
                                <form.Field name={`tasks[${index}].materials[${materialIndex}].productId`} form={form}
                                  children={(matField: any) => ( // Explicitly type as any
                                    <div className="sm:col-span-2">
                                        <ProductSelector
                                            label={t('quotes.materialProductIdLabel')}
                                            value={matField.state.value}
                                            onChange={(productId) => matField.handleChange(productId)}
                                            disabled={readOnly}
                                        />
                                    </div>
                                  )}
                                />
                                <form.Field name={`tasks[${index}].materials[${materialIndex}].quantity`} form={form}
                                  children={(matField: any) => ( // Explicitly type as any
                                    <NumberInput label={t('quotes.materialQuantityLabel')} value={matField.state.value} onChange={v => matField.handleChange(v ?? 1)} onBlur={matField.handleBlur} min={1} step={1} formatOptions={{ maximumFractionDigits: 0 }} isDisabled={readOnly} aria-label="Material Quantity"/>
                                  )}
                                />
                                <form.Field name={`tasks[${index}].materials[${materialIndex}].unitPrice`} form={form}
                                  children={(matField: any) => ( // Explicitly type as any
                                    <NumberInput label={t('quotes.materialUnitPriceLabel')} value={matField.state.value} onChange={v => matField.handleChange(v ?? 0)} onBlur={matField.handleBlur} min={0} step={0.01} formatOptions={{ style: 'currency', currency: 'USD' }} isDisabled={readOnly} aria-label="Material Unit Price"/>
                                  )}
                                />
                                <form.Field name={`tasks[${index}].materials[${materialIndex}].notes`} form={form}
                                  children={(matField: any) => ( // Explicitly type as any
                                      <Textarea label={t('quotes.materialNotesLabel')} placeholder={t('quotes.materialNotesPlaceholder')} value={matField.state.value ?? ''} onChange={e => matField.handleChange(e.target.value || null)} onBlur={matField.handleBlur} rows={1} isDisabled={readOnly} aria-label="Material Notes"/>
                                  )}
                                />
                              </div>

                            </div>
                          ))}
                          {/* Add Material Button */}
                          {!readOnly && (
                              <Button
                                color="default"
                                variant="ghost"
                                size="sm"
                                onClick={() => materialsField.pushValue({ 
                                    id: undefined, // Ensure new items don't have an ID initially
                                    quantity: 1, 
                                    unitPrice: 0, 
                                    productId: undefined, 
                                    notes: null 
                                })}
                              >
                                {t('quotes.addMaterialButton')}
                              </Button>
                          )}
                        </div>
                      )}
                    />
                </div>
              )}
            </div>
          ))}
            </div>
          )}
      </CardBody>
      {/* Add Task button is rendered here, controlled by the form context */}
      {!readOnly && (
         <CardFooter>
             <Button color="primary" variant="ghost" onClick={() => field.pushValue({ description: '', price: 0, materialType: 'lumpsum', materials: [] })}>
                {t('quotes.addTaskButton')}
            </Button>
         </CardFooter>
       )}
    </Card>
  );
};
