"use client";

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Input,
  Button,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  Textarea,
  NumberInput,
  Select,
  SelectItem,
  Divider,
  Breadcrumbs,
  BreadcrumbItem,
} from '@heroui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useQuotes } from '~/contexts/QuotesContext';
import { useTranslation } from '~/hooks/useTranslation';
import { ProductCategory } from '~/server/db/schema';

export default function NewQuotePage() {
  const router = useRouter();
  const { status } = useSession();
  const { t, formatCurrency } = useTranslation();
  const [mounted, setMounted] = useState(false);
  
  // Get quote context
  const {
    quoteFormData,
    tasks,
    products,
    calculateTotals,
    setQuoteFormData,
    addTask,
    updateTask,
    removeTask,
    addMaterial,
    updateMaterial,
    removeMaterial,
    createQuote,
    isSubmitting,
    resetForm,
  } = useQuotes();
  
  // Initialize the form with at least one task if none exist
  useEffect(() => {
    if (mounted && tasks.length === 0) {
      addTask();
    }
  }, [mounted, tasks.length, addTask]);
  
  // Set mounted state
  useEffect(() => {
    resetForm();
    setMounted(true);
  }, [resetForm]);
  
  // Handle input changes
  const handleInputChange = (name: string, value: string) => {
    setQuoteFormData({ [name]: value });
  };
  
  const handleNumberChange = (name: string, value: number) => {
    setQuoteFormData({ [name]: value });
  };
  
  // Handle task changes
  const handleTaskChange = (index: number, field: string, value: string | number) => {
    updateTask(index, { [field]: value });
  };
  
  const handleTaskMaterialTypeChange = (index: number, type: 'lumpsum' | 'itemized') => {
    updateTask(index, { materialType: type });
  };
  
  // Handle material changes
  const handleMaterialChange = (taskIndex: number, materialIndex: number, field: string, value: string | number) => {
    updateMaterial(taskIndex, materialIndex, { [field]: value });
  };
  
  const handleMaterialProductChange = (taskIndex: number, materialIndex: number, productId: string) => {
    // Find the product to get its details
    const product = products.find(p => p.id === productId);
    if (product) {
      updateMaterial(taskIndex, materialIndex, {
        productId,
        name: product.name,
        description: product.description || undefined,
        unitPrice: Number(product.unitPrice),
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    const quoteId = await createQuote();
    if (quoteId) {
      router.push(`/admin/quotes/${quoteId}`);
    }
  };
  
  // Calculate totals
  const totals = calculateTotals();
  
  // Render loading state
  if (!mounted || status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  
  // Render the form
  return (
    <>
      <Head>
        <title>New Quote | Construction Quote Manager</title>
      </Head>
      
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Breadcrumbs>
            <BreadcrumbItem href="/admin">Dashboard</BreadcrumbItem>
            <BreadcrumbItem href="/admin/quotes">Quotes</BreadcrumbItem>
            <BreadcrumbItem>New Quote</BreadcrumbItem>
          </Breadcrumbs>
          
          <h1 className="text-2xl font-bold mt-4">Create New Quote</h1>
          <p className="text-muted-foreground">Add a new quote with tasks and materials</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Quote Information</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <Input
                    label="Quote Title"
                    name="title"
                    value={quoteFormData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Quote for..."
                    required
                    aria-label="Quote title"
                  />
                  
                  <Input
                    label="Customer Name"
                    name="customerName"
                    value={quoteFormData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder="Customer name"
                    required
                    aria-label="Customer name"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Customer Email"
                      name="customerEmail"
                      value={quoteFormData.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      placeholder="customer@example.com"
                      type="email"
                      aria-label="Customer email"
                    />
                    
                    <Input
                      label="Customer Phone"
                      name="customerPhone"
                      value={quoteFormData.customerPhone}
                      onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      aria-label="Customer phone"
                    />
                  </div>
                  
                  <Textarea
                    label="Notes"
                    name="notes"
                    value={quoteFormData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes..."
                    aria-label="Quote notes"
                  />
                </div>
              </CardBody>
            </Card>
            
            {/* Tasks Section */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Tasks</h2>
                <Button
                  color="primary"
                  size="sm"
                  startContent={<Plus size={16} />}
                  onPress={addTask}
                  aria-label="Add new task"
                >
                  Add Task
                </Button>
              </div>
              
              {tasks.map((task, taskIndex) => (
                <Card key={taskIndex} className="mb-4">
                  <CardBody>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium">Task {taskIndex + 1}</h3>
                      <Button
                        isIconOnly
                        variant="light"
                        color="danger"
                        size="sm"
                        onPress={() => removeTask(taskIndex)}
                        aria-label={`Remove task ${taskIndex + 1}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <Input
                        label="Task Name"
                        value={task.name}
                        onChange={(e) => handleTaskChange(taskIndex, 'name', e.target.value)}
                        placeholder="Task description"
                        required
                        aria-label={`Name for task ${taskIndex + 1}`}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <NumberInput
                          label="Price"
                          value={parseFloat(task.price) || 0}
                          onValueChange={(value) => handleTaskChange(taskIndex, 'price', value.toString())}
                          startContent="$"
                          min={0}
                          step={0.01}
                          formatOptions={{ 
                            style: 'decimal', 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          }}
                          aria-label={`Price for task ${taskIndex + 1}`}
                        />
                        
                        <NumberInput
                          label="Quantity"
                          value={task.quantity}
                          onValueChange={(value) => handleTaskChange(taskIndex, 'quantity', value)}
                          min={1}
                          step={1}
                          aria-label={`Quantity for task ${taskIndex + 1}`}
                        />
                      </div>
                      
                      <Divider />
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Materials Calculation</p>
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            color={task.materialType === 'lumpsum' ? 'primary' : 'default'}
                            variant={task.materialType === 'lumpsum' ? 'solid' : 'flat'}
                            onPress={() => handleTaskMaterialTypeChange(taskIndex, 'lumpsum')}
                            className="w-full"
                            aria-label="Use lump sum for materials"
                          >
                            Lump Sum
                          </Button>
                          
                          <Button
                            color={task.materialType === 'itemized' ? 'primary' : 'default'}
                            variant={task.materialType === 'itemized' ? 'solid' : 'flat'}
                            onPress={() => handleTaskMaterialTypeChange(taskIndex, 'itemized')}
                            className="w-full"
                            aria-label="Use itemized materials"
                          >
                            Itemized
                          </Button>
                        </div>
                      </div>
                      
                      {task.materialType === 'lumpsum' ? (
                        <NumberInput
                          label="Estimated Materials Cost"
                          value={task.estimatedMaterialsCostLumpSum}
                          onValueChange={(value) => handleTaskChange(taskIndex, 'estimatedMaterialsCostLumpSum', value)}
                          startContent="$"
                          min={0}
                          step={0.01}
                          formatOptions={{ 
                            style: 'decimal', 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          }}
                          aria-label={`Materials cost for task ${taskIndex + 1}`}
                        />
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Materials</p>
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              startContent={<Plus size={16} />}
                              onPress={() => addMaterial(taskIndex)}
                              aria-label={`Add material to task ${taskIndex + 1}`}
                            >
                              Add Material
                            </Button>
                          </div>
                          
                          {task.materials.map((material, materialIndex) => (
                            <div 
                              key={materialIndex} 
                              className="border p-4 rounded-lg space-y-3"
                            >
                              <div className="flex justify-between items-start">
                                <p className="font-medium">Material {materialIndex + 1}</p>
                                <Button
                                  isIconOnly
                                  variant="light"
                                  color="danger"
                                  size="sm"
                                  onPress={() => removeMaterial(taskIndex, materialIndex)}
                                  aria-label={`Remove material ${materialIndex + 1}`}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                              
                              <Select
                                label="Select Product"
                                placeholder="Choose a product"
                                selectedKeys={material.productId ? [material.productId] : []}
                                onChange={(e) => handleMaterialProductChange(taskIndex, materialIndex, e.target.value)}
                                aria-label={`Product for material ${materialIndex + 1}`}
                              >
                                {products.map((product) => (
                                  <SelectItem key={product.id}>
                                    {product.name} ({formatCurrency(product.unitPrice)})
                                  </SelectItem>
                                ))}
                              </Select>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <NumberInput
                                  label="Unit Price"
                                  value={material.unitPrice}
                                  onValueChange={(value) => 
                                    handleMaterialChange(taskIndex, materialIndex, 'unitPrice', value)
                                  }
                                  startContent="$"
                                  min={0}
                                  step={0.01}
                                  formatOptions={{ 
                                    style: 'decimal', 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2 
                                  }}
                                  aria-label={`Unit price for material ${materialIndex + 1}`}
                                />
                                
                                <NumberInput
                                  label="Quantity"
                                  value={material.quantity}
                                  onValueChange={(value) => 
                                    handleMaterialChange(taskIndex, materialIndex, 'quantity', value)
                                  }
                                  min={1}
                                  step={1}
                                  aria-label={`Quantity for material ${materialIndex + 1}`}
                                />
                              </div>
                              
                              <div className="flex justify-between items-center pt-2">
                                <p className="text-sm text-muted-foreground">Total:</p>
                                <p className="font-medium">
                                  {formatCurrency(material.unitPrice * material.quantity)}
                                </p>
                              </div>
                            </div>
                          ))}
                          
                          {task.materials.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground border border-dashed rounded-lg">
                              No materials added yet. Click "Add Material" to add one.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
              
              {tasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  No tasks added yet. Click "Add Task" to add one.
                </div>
              )}
            </div>
          </div>
          
          {/* Quote Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Quote Summary</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground">Tasks Subtotal:</p>
                      <p className="font-medium">{formatCurrency(totals.subtotalTasks)}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground">Materials Subtotal:</p>
                      <p className="font-medium">{formatCurrency(totals.subtotalMaterials)}</p>
                    </div>
                    
                    <Divider />
                    
                    <NumberInput
                      label="Complexity/Contingency Charge"
                      value={quoteFormData.complexityCharge}
                      onValueChange={(value) => handleNumberChange('complexityCharge', value)}
                      startContent="$"
                      min={0}
                      step={0.01}
                      formatOptions={{ 
                        style: 'decimal', 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      }}
                      aria-label="Complexity charge"
                    />
                    
                    <NumberInput
                      label="Markup/Profit"
                      value={quoteFormData.markupCharge}
                      onValueChange={(value) => handleNumberChange('markupCharge', value)}
                      startContent="$"
                      min={0}
                      step={0.01}
                      formatOptions={{ 
                        style: 'decimal', 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      }}
                      aria-label="Markup charge"
                    />
                    
                    <Divider />
                    
                    <div className="flex justify-between items-center font-bold">
                      <p>Grand Total:</p>
                      <p className="text-xl">{formatCurrency(totals.grandTotal)}</p>
                    </div>
                    
                    <div className="pt-4">
                      <Button
                        color="primary"
                        className="w-full"
                        size="lg"
                        onPress={handleSubmit}
                        isLoading={isSubmitting}
                        isDisabled={isSubmitting || tasks.length === 0 || !quoteFormData.title || !quoteFormData.customerName}
                        aria-label="Create quote"
                      >
                        {isSubmitting ? 'Creating Quote...' : 'Create Quote'}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
