'use client';

import React from 'react';
import { useQuoteStore } from '~/store/quoteStore';
import { QuoteHeader } from './QuoteHeader';
import { CustomerInfoForm } from './CustomerInfoForm';
import { TaskList } from './TaskList';
import { QuoteSummary } from './QuoteSummary';
import { EntityForm } from '~/components/shared/EntityForm';
import type { inferRouterInputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';

// Define types matching the store
type RouterInput = inferRouterInputs<AppRouter>;
type QuoteFormData = RouterInput['quote']['create'];
type TaskFormData = NonNullable<QuoteFormData['tasks']>[number];

export function QuoteForm() {
  const { 
    formData, 
    addTask, 
    removeTask, 
    updateTask,
    addMaterial,
    removeMaterial,
    updateMaterial,
    updateField
  } = useQuoteStore();

  const handleTaskChange = (index: number, task: TaskFormData) => {
    updateTask(index, task);
  };

  // QuoteSummary uses field:string and our store uses keyof QuoteFormData
  const handleNumberChange = (field: string, value: number) => {
    updateField(field as any, value);
  };

  const handleSubmit = async (data: QuoteFormData) => {
    // TODO: Implement quote submission
    console.log('Submitting quote:', data);
  };

  const handleFieldChange = (field: keyof QuoteFormData, value: any) => {
    updateField(field, value);
  };

  // Calculate totals for summary
  const subtotalTasks = formData.tasks?.reduce((sum, task) => sum + task.price, 0) ?? 0;
  const subtotalMaterials = formData.tasks?.reduce((sum, task) => {
    return sum + (task.materials?.reduce(
      (materialSum, material) => materialSum + (material.quantity ?? 0) * (material.unitPrice ?? 0),
      0
    ) ?? 0);
  }, 0) ?? 0;
  
  // Use values from store - handle as any since the type definitions might be out of sync
  const storeData = formData as any;
  const complexityCharge = storeData.complexityCharge ?? 0;
  const markupCharge = storeData.markupCharge ?? 0;
  const grandTotal = subtotalTasks + subtotalMaterials + complexityCharge + markupCharge;

  // Custom fields for quotes form
  const renderCustomFields = () => (
    <div className="space-y-6">
      <QuoteHeader />
      <CustomerInfoForm />
      
      <TaskList 
        tasks={formData.tasks ?? []}
        onAddTask={addTask}
        onRemoveTask={removeTask}
        onUpdateTask={handleTaskChange}
        onAddMaterial={addMaterial}
        onRemoveMaterial={removeMaterial}
        onUpdateMaterial={updateMaterial}
      />

      <QuoteSummary
        data={{
          subtotalTasks,
          subtotalMaterials,
          complexityCharge,
          markupCharge,
          grandTotal,
        }}
        onUpdate={handleNumberChange}
      />
    </div>
  );
  
  return (
    <EntityForm
      title="Create Quote"
      entity={formData}
      fields={[]} // We're using custom fields instead of the default fields
      onSubmit={handleSubmit}
      onChange={handleFieldChange}
      renderCustomFields={renderCustomFields}
      submitText="Save Quote"
      backUrl="/quotes"
    />
  );
}
