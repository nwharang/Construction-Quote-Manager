'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
import { useEntityCrud } from '~/hooks/useEntityCrud';
import { api } from '~/utils/api';
import { useEntityStore } from '~/store/entityStore';
import { useTranslation } from '~/hooks/useTranslation';
import { ProductCategory } from '~/server/db/schema';
import type { Product, Task, Material } from '~/types/quote';
import { MaterialModal } from '~/components/quotes/MaterialModal';

export default function NewQuotePage() {
  const router = useRouter();
  const { status } = useSession();
  const { t, formatCurrency } = useTranslation();
  const [mounted, setMounted] = useState(false);

  const [quoteFormData, setQuoteFormData] = useState<any>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Set up entity store for quotes
  const entitySettings = useEntityStore((state) => state.settings);

  // Get tRPC hooks
  const utils = api.useContext();

  // Create quote mutation
  const createQuoteMutation = api.quote.create.useMutation({
    onSuccess: () => {
      utils.quote.getAll.invalidate();
      router.push('/admin/quotes');
    },
  });

  // Get products query
  const { data: productsData, isLoading: productsLoading } = api.product.getAll.useQuery({});

  // Function to add a task
  const addTask = useCallback(() => {
    setTasks((prevTasks) => [
      ...prevTasks,
      {
        id: crypto.randomUUID(),
        description: '',
        price: '0.00',
        quantity: 1,
        materialType: 'lumpsum',
        estimatedMaterialsCostLumpSum: 0,
        materials: [],
      },
    ]);
  }, []);

  // Function to update a task
  const updateTask = useCallback((index: number, task: any) => {
    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      newTasks[index] = { ...newTasks[index], ...task };
      return newTasks;
    });
  }, []);

  // Function to remove a task
  const removeTask = useCallback((index: number) => {
    setTasks((prevTasks) => prevTasks.filter((_, i) => i !== index));
  }, []);

  // Function to add a material
  const addMaterial = useCallback((taskIndex: number) => {
    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      newTasks[taskIndex].materials = [
        ...newTasks[taskIndex].materials,
        {
          id: crypto.randomUUID(),
          name: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
        },
      ];
      return newTasks;
    });
  }, []);

  // Function to update a material
  const updateMaterial = useCallback(
    (taskIndex: number, materialIndex: number, material: Partial<Material>) => {
      setTasks((prevTasks) => {
        const newTasks = [...prevTasks];
        newTasks[taskIndex].materials[materialIndex] = {
          ...newTasks[taskIndex].materials[materialIndex],
          ...material,
        };
        return newTasks;
      });
    },
    []
  );

  // Function to remove a material
  const removeMaterial = useCallback((taskIndex: number, materialIndex: number) => {
    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      newTasks[taskIndex].materials = newTasks[taskIndex].materials.filter(
        (_: Material, i: number) => i !== materialIndex
      );
      return newTasks;
    });
  }, []);

  // Calculate totals
  const calculateTotals = useCallback(() => {
    // Calculate subtotals for tasks and materials
    let subtotalTasks = 0;
    let subtotalMaterials = 0;

    tasks.forEach((task) => {
      // Task subtotal = price * quantity
      const taskPrice = parseFloat(task.price) || 0;
      const taskQuantity = task.quantity || 1;
      subtotalTasks += taskPrice * taskQuantity;

      // Materials subtotal
      if (task.materialType === 'lumpsum') {
        // If lump sum, just add the estimated cost
        subtotalMaterials += task.estimatedMaterialsCostLumpSum || 0;
      } else {
        // If itemized, calculate each material cost
        task.materials.forEach((material: any) => {
          const materialQuantity = material.quantity || 0;
          const materialUnitPrice = material.unitPrice || 0;
          subtotalMaterials += materialQuantity * materialUnitPrice;
        });
      }
    });

    // Calculate combined subtotal
    const subtotalCombined = subtotalTasks + subtotalMaterials;

    // Apply complexity and markup charges
    const complexityCharge = quoteFormData.complexityCharge || 0;
    const markupCharge = quoteFormData.markupCharge || 0;

    // Calculate grand total
    const grandTotal = subtotalCombined + complexityCharge + markupCharge;

    return {
      subtotalTasks: Math.round(subtotalTasks * 100) / 100,
      subtotalMaterials: Math.round(subtotalMaterials * 100) / 100,
      subtotalCombined: Math.round(subtotalCombined * 100) / 100,
      complexityCharge: Math.round(complexityCharge * 100) / 100,
      markupCharge: Math.round(markupCharge * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  }, [tasks, quoteFormData]);

  // Function to create a quote
  const createQuote = async () => {
    try {
      // Create quote data object
      const quoteData = {
        ...quoteFormData,
        tasks: tasks.map((task) => ({
          description: task.description,
          price: parseFloat(task.price),
          quantity: task.quantity,
          materialType: task.materialType,
          estimatedMaterialsCostLumpSum: task.estimatedMaterialsCostLumpSum,
          materials: task.materials.map((material: any) => ({
            name: material.name,
            description: material.description,
            quantity: material.quantity,
            unitPrice: material.unitPrice,
            productId: material.productId,
          })),
        })),
      };

      // Submit the quote
      return await createQuoteMutation.mutateAsync(quoteData);
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  };

  // Reset form
  const resetForm = useCallback(() => {
    setQuoteFormData({
      title: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      notes: '',
      complexityCharge: 0,
      markupCharge: 0,
    });
    setTasks([]);
  }, []);

  // Initialize the form with at least one task if none exist
  useEffect(() => {
    if (mounted && tasks.length === 0) {
      addTask();
    }
  }, [mounted, tasks.length, addTask]);

  // Set mounted state and initialize data
  useEffect(() => {
    resetForm();
    setMounted(true);

    // Set products from API data
    if (productsData) {
      setProducts(productsData.items);
    }
  }, [resetForm, productsData]);

  // State and functions for material modal
  const [materialModalIsOpen, setMaterialModalIsOpen] = useState(false);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState<number | undefined>(undefined);
  const [initialMaterial, setInitialMaterial] = useState<Partial<Material>>({});

  // Handle input changes
  const handleInputChange = (name: string, value: string) => {
    setQuoteFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name: string, value: number) => {
    setQuoteFormData({ [name]: value });
  };

  // Handle task changes
  const handleTaskChange = (
    index: number,
    fieldOrEvent:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      | string,
    value?: string | number
  ) => {
    if (typeof fieldOrEvent === 'string') {
      updateTask(index, { [fieldOrEvent]: value });
    } else {
      const field = fieldOrEvent.target.name;
      const value = fieldOrEvent.target.value;
      updateTask(index, { [field]: value });
    }
  };

  const handleTaskMaterialTypeChange = (index: number, type: 'lumpsum' | 'itemized') => {
    updateTask(index, { materialType: type });
  };

  // Handle material changes
  const handleMaterialChange = (
    taskIndex: number,
    materialIndex: number,
    fieldOrEvent:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      | string,
    value?: string | number
  ) => {
    if (typeof fieldOrEvent === 'string') {
      updateMaterial(taskIndex, materialIndex, { [fieldOrEvent]: value });
    } else {
      const field = fieldOrEvent.target.name;
      const value = fieldOrEvent.target.value;
      updateMaterial(taskIndex, materialIndex, { [field]: value });
    }
  };

  const handleMaterialProductChange = (
    taskIndex: number,
    materialIndex: number,
    productId: string
  ) => {
    // Find the product to get its details
    const product = products.find((p: Product) => p.id === productId);
    if (product) {
      updateMaterial(taskIndex, materialIndex, {
        productId,
        name: product.name,
        description: product.description || undefined,
        unitPrice: Number(product.unitPrice),
      });
    }
  };

  // Helper method to format product options
  const productOptions = products.map((p: Product) => ({
    value: p.id,
    label: p.name,
  }));

  // Function to open material modal
  const openMaterialModal = (taskIndex: number, materialIndex?: number) => {
    setSelectedTaskIndex(taskIndex);
    
    if (typeof materialIndex === 'number') {
      // Editing existing material
      setSelectedMaterialIndex(materialIndex);
      const material = tasks[taskIndex].materials[materialIndex];
      setInitialMaterial({ ...material });
    } else {
      // Creating new material
      setSelectedMaterialIndex(undefined);
      setInitialMaterial({
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        productId: '',
      });
    }
    
    setMaterialModalIsOpen(true);
  };

  // Function to close material modal
  const closeMaterialModal = () => {
    setSelectedTaskIndex(null);
    setSelectedMaterialIndex(undefined);
    setInitialMaterial({});
    setMaterialModalIsOpen(false);
  };

  // Function to get material display information
  const getMaterialDisplay = (material: Material) => {
    const total = (material.quantity || 0) * (material.unitPrice || 0);
    return {
      name: material.name || '',
      total: formatCurrency(total),
    };
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      await createQuote();
      router.push('/admin/quotes');
    } catch (error) {
      console.error('Error creating quote:', error);
    }
  };

  // Calculate totals once for performance
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

          <h1 className="mt-4 text-2xl font-bold">Create New Quote</h1>
          <p className="text-muted-foreground">Add a new quote with tasks and materials</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <div className="mb-4 flex items-center justify-between">
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
                <Card key={task.id} className="mb-4">
                  <CardBody>
                    <div className="mb-4 flex items-start justify-between">
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
                      <Textarea
                        label="Description"
                        value={task.description}
                        onChange={(e) => handleTaskChange(taskIndex, 'description', e.target.value)}
                        name="description"
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <NumberInput
                          id={`task-${taskIndex}-price`}
                          label="Price"
                          value={parseFloat(task.price) || 0}
                          onValueChange={(value) =>
                            handleTaskChange(taskIndex, 'price', value.toString())
                          }
                          startContent="$"
                          min={0}
                          step={0.01}
                          formatOptions={{
                            style: 'decimal',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }}
                          required
                        />

                        <NumberInput
                          id={`task-${taskIndex}-quantity`}
                          label="Quantity"
                          value={task.quantity}
                          onValueChange={(value) => handleTaskChange(taskIndex, 'quantity', value)}
                          min={1}
                          step={1}
                          required
                        />
                      </div>

                      <Divider />

                      <div>
                        <p className="mb-2 text-sm font-medium">Materials Calculation</p>
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
                          id={`task-${taskIndex}-materials-cost`}
                          label="Estimated Materials Cost"
                          value={task.estimatedMaterialsCostLumpSum}
                          onValueChange={(value) =>
                            handleTaskChange(taskIndex, 'estimatedMaterialsCostLumpSum', value)
                          }
                          startContent="$"
                          min={0}
                          step={0.01}
                          formatOptions={{
                            style: 'decimal',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }}
                        />
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">Materials</p>
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              startContent={<Plus size={16} />}
                              onPress={() => openMaterialModal(taskIndex)}
                              aria-label={`Add material to task ${taskIndex + 1}`}
                            >
                              Add Material
                            </Button>
                          </div>

                          {task.materials.map((material: Material, materialIndex: number) => (
                            <div key={material.id} className="my-1 rounded bg-gray-50 p-2">
                              <div className="flex justify-between">
                                <span>{material.name}</span>
                                <div>
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
                              </div>
                            </div>
                          ))}

                          {task.materials.length === 0 && (
                            <div className="text-muted-foreground rounded-lg border border-dashed py-4 text-center">
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
                <div className="text-muted-foreground rounded-lg border border-dashed py-8 text-center">
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
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">Tasks Subtotal:</p>
                      <p className="font-medium">{formatCurrency(totals.subtotalTasks)}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">Materials Subtotal:</p>
                      <p className="font-medium">{formatCurrency(totals.subtotalMaterials)}</p>
                    </div>

                    <Divider />

                    <NumberInput
                      id="complexity-charge"
                      label="Complexity/Contingency Charge"
                      value={quoteFormData.complexityCharge}
                      onValueChange={(value) => handleNumberChange('complexityCharge', value)}
                      startContent="$"
                      min={0}
                      step={0.01}
                      formatOptions={{
                        style: 'decimal',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }}
                      required
                    />

                    <NumberInput
                      id="markup-charge"
                      label="Markup/Profit"
                      value={quoteFormData.markupCharge}
                      onValueChange={(value) => handleNumberChange('markupCharge', value)}
                      startContent="$"
                      min={0}
                      step={0.01}
                      formatOptions={{
                        style: 'decimal',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }}
                      required
                    />

                    <Divider />

                    <div className="flex items-center justify-between font-bold">
                      <p>Grand Total:</p>
                      <p className="text-xl">{formatCurrency(totals.grandTotal)}</p>
                    </div>

                    <div className="pt-4">
                      <Button
                        color="primary"
                        className="w-full"
                        size="lg"
                        onPress={handleSubmit}
                        isLoading={createQuoteMutation.isPending}
                        isDisabled={
                          createQuoteMutation.isPending ||
                          tasks.length === 0 ||
                          !quoteFormData.title ||
                          !quoteFormData.customerName
                        }
                        aria-label="Create quote"
                      >
                        {createQuoteMutation.isPending ? 'Creating Quote...' : 'Create Quote'}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Material Modal */}
      <MaterialModal
        isOpen={materialModalIsOpen}
        onOpenChange={setMaterialModalIsOpen}
        initialMaterial={initialMaterial}
        isEditing={selectedMaterialIndex !== undefined}
        taskIndex={selectedTaskIndex}
        materialIndex={selectedMaterialIndex}
        products={products}
        onSaveMaterial={(material, taskIndex, materialIndex) => {
          if (taskIndex !== null) {
            if (materialIndex !== undefined) {
              // Update existing material
              updateMaterial(taskIndex, materialIndex, material);
            } else {
              // Add new material
              const newMaterial = {
                ...material,
                id: crypto.randomUUID(),
              };

              setTasks((prevTasks) => {
                const newTasks = [...prevTasks];
                newTasks[taskIndex].materials = [...newTasks[taskIndex].materials, newMaterial];
                return newTasks;
              });
            }

            // Close the modal
            closeMaterialModal();
          }
        }}
      />
    </>
  );
}
