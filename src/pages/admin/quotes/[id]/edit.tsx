'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Input,
  Textarea,
  Select,
  SelectItem,
  NumberInput,
  Spinner,
  Divider,
  Breadcrumbs,
  BreadcrumbItem,
} from '@heroui/react';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { useToastStore } from '~/store';
import { formatCurrency } from '~/utils/currency';
import { MaterialModal } from '~/components/quotes/MaterialModal';
import type { Material, Product, Task, QuoteFormData } from '~/types/quote';

// Helper function for generating UUIDs
const generateUUID = () => {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
};

export default function EditQuotePage() {
  const router = useRouter();
  const { id } = router.query;
  const { status } = useSession();
  const { formatCurrency } = useTranslation();
  const toast = useToastStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for quote data
  const [quoteFormData, setQuoteFormDataState] = useState<QuoteFormData>({
    title: '',
    description: '',
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    status: 'DRAFT',
    notes: '',
    tasks: [],
    markupPercentage: 0,
    complexityPercentage: 0,
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentQuote, setCurrentQuote] = useState<any>(null);

  // Material modal state
  const [materialModalIsOpen, setMaterialModalIsOpen] = useState(false);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState<number | null>(null);

  // Get products data
  const { data: productsData } = api.product.getAll.useQuery(
    {},
    {
      enabled: status === 'authenticated' && mounted,
    }
  );

  // Set mounted state on first render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load products when data is available
  useEffect(() => {
    if (productsData?.items) {
      setProducts(productsData.items);
    }
  }, [productsData]);

  // Update quote form data
  const setQuoteFormData = useCallback((data: Partial<QuoteFormData>) => {
    setQuoteFormDataState((prev) => ({ ...prev, ...data }));
  }, []);

  // Add a new task
  const addTask = useCallback(() => {
    const newTask: Task = {
      id: generateUUID(),
      quoteId: typeof id === 'string' ? id : '',
      description: '',
      price: 0,
      order: tasks.length,
      materialType: 'lumpsum',
      estimatedMaterialsCostLumpSum: 0,
      materials: [],
    };

    setTasks((prev) => [...prev, newTask]);
  }, [tasks.length, id]);

  // Update a task
  const updateTask = useCallback((index: number, data: Partial<Task>) => {
    setTasks((prev) => {
      const newTasks = [...prev];
      if (newTasks[index]) {
        newTasks[index] = { ...newTasks[index], ...data };
      }
      return newTasks;
    });
  }, []);

  // Remove a task
  const removeTask = useCallback((index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Add a material to a task
  const addMaterial = useCallback((taskIndex: number) => {
    setTasks((prev) => {
      const newTasks = [...prev];
      if (newTasks[taskIndex]) {
        const newMaterial: Material = {
          id: generateUUID(),
          taskId: newTasks[taskIndex].id,
          name: '',
          quantity: 1,
          unitPrice: 0,
        };

        newTasks[taskIndex].materials = [...newTasks[taskIndex].materials, newMaterial];
      }
      return newTasks;
    });
  }, []);

  // Update a material
  const updateMaterial = useCallback(
    (taskIndex: number, materialIndex: number, data: Partial<Material>) => {
      setTasks((prev) => {
        const newTasks = [...prev];
        if (
          newTasks[taskIndex] &&
          newTasks[taskIndex].materials &&
          newTasks[taskIndex].materials[materialIndex]
        ) {
          newTasks[taskIndex].materials[materialIndex] = {
            ...newTasks[taskIndex].materials[materialIndex],
            ...data,
          };
        }
        return newTasks;
      });
    },
    []
  );

  // Remove a material
  const removeMaterial = useCallback((taskIndex: number, materialIndex: number) => {
    setTasks((prev) => {
      const newTasks = [...prev];
      if (newTasks[taskIndex] && newTasks[taskIndex].materials) {
        newTasks[taskIndex].materials = newTasks[taskIndex].materials.filter(
          (_, i) => i !== materialIndex
        );
      }
      return newTasks;
    });
  }, []);

  // Calculate totals based on tasks and materials
  const calculateTotals = useCallback(() => {
    // Calculate tasks subtotal
    const subtotalTasks = tasks.reduce((total, task) => {
      return total + (parseFloat(task.price.toString()) || 0);
    }, 0);

    // Calculate materials subtotal
    const subtotalMaterials = tasks.reduce((total, task) => {
      if (task.materialType === 'lumpsum') {
        return total + (task.estimatedMaterialsCostLumpSum || 0);
      } else {
        return (
          total +
          task.materials.reduce((sum, material) => {
            return sum + (material.quantity || 0) * (material.unitPrice || 0);
          }, 0)
        );
      }
    }, 0);

    // Calculate complexity and markup charges
    const complexityCharge =
      (subtotalTasks + subtotalMaterials) * (quoteFormData.complexityPercentage / 100);
    const markupCharge =
      (subtotalTasks + subtotalMaterials + complexityCharge) *
      (quoteFormData.markupPercentage / 100);

    // Calculate grand total
    const grandTotal = subtotalTasks + subtotalMaterials + complexityCharge + markupCharge;

    return {
      subtotalTasks,
      subtotalMaterials,
      complexityCharge,
      markupCharge,
      grandTotal,
    };
  }, [tasks, quoteFormData.complexityPercentage, quoteFormData.markupPercentage]);

  // Quote update mutation
  const updateQuoteMutation = api.quote.update.useMutation({
    onSuccess: () => {
      toast.success('Quote updated successfully');
      router.push(`/admin/quotes/${id}`);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      console.error('Error updating quote:', error);
    },
  });

  // Fetch a quote by ID
  const fetchQuoteById = useCallback(
    async (quoteId: string) => {
      try {
        setLoading(true);
        const result = await api.quote.getById.fetch({ id: quoteId });

        if (result) {
          setCurrentQuote(result);

          // Populate form data
          setQuoteFormDataState({
            id: result.id,
            title: result.title,
            customerId: result.customerId,
            customerName: result.customerName || '',
            customerEmail: result.customerEmail || '',
            customerPhone: result.customerPhone || '',
            status: result.status as any,
            notes: result.notes || '',
            tasks: [],
            markupPercentage: parseFloat(result.markupCharge?.toString() || '0'),
            complexityPercentage: parseFloat(result.complexityCharge?.toString() || '0'),
          });

          // Populate tasks
          if (result.tasks && Array.isArray(result.tasks)) {
            setTasks(result.tasks);
          }
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        toast.error('Failed to load quote');
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Fetch quote data when component mounts
  useEffect(() => {
    if (mounted && id && typeof id === 'string' && status === 'authenticated') {
      fetchQuoteById(id);
    }
  }, [mounted, id, status, fetchQuoteById]);

  // Open material modal
  const openMaterialModal = useCallback((taskIndex: number, materialIndex?: number) => {
    setSelectedTaskIndex(taskIndex);
    if (materialIndex !== undefined) {
      setSelectedMaterialIndex(materialIndex);
    } else {
      setSelectedMaterialIndex(null);
    }
    setMaterialModalIsOpen(true);
  }, []);

  // Close material modal
  const closeMaterialModal = useCallback(() => {
    setSelectedTaskIndex(null);
    setSelectedMaterialIndex(null);
    setMaterialModalIsOpen(false);
  }, []);

  // Handle material save
  const handleSaveMaterial = useCallback(
    (material: Omit<Material, 'id' | 'taskId'>, taskIndex: number, materialIndex?: number) => {
      if (materialIndex !== undefined) {
        // Update existing material
        updateMaterial(taskIndex, materialIndex, material);
      } else {
        // Add new material
        const newMaterial = {
          ...material,
          id: generateUUID(),
          taskId: tasks[taskIndex]?.id || '',
        };

        setTasks((prevTasks) => {
          const newTasks = [...prevTasks];
          newTasks[taskIndex].materials = [
            ...newTasks[taskIndex].materials,
            newMaterial as Material,
          ];
          return newTasks;
        });
      }
      closeMaterialModal();
    },
    [tasks, updateMaterial, closeMaterialModal]
  );

  // Handle input changes
  const handleInputChange = (field: keyof typeof quoteFormData, value: string | number) => {
    setQuoteFormData({ [field]: value });
  };

  // Handle task changes
  const handleTaskChange = (taskIndex: number, field: string, value: any) => {
    updateTask(taskIndex, { [field]: value });
  };

  // Handle task material type change
  const handleTaskMaterialTypeChange = (taskIndex: number, type: 'lumpsum' | 'itemized') => {
    updateTask(taskIndex, { materialType: type });
  };

  // Handle material product selection
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
        unitPrice:
          typeof product.unitPrice === 'string' ? parseFloat(product.unitPrice) : product.unitPrice,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (id && typeof id === 'string') {
      try {
        setIsSubmitting(true);
        // Prepare the payload
        const payload = {
          ...quoteFormData,
          id,
          tasks: tasks.map((task) => ({
            ...task,
            materials: task.materials.map((material) => ({
              ...material,
              taskId: task.id,
            })),
          })),
        };

        await updateQuoteMutation.mutateAsync(payload);
      } catch (error) {
        console.error('Error updating quote:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Render loading state
  if (!mounted || status === 'loading' || loading) {
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

  // Get calculated totals
  const totals = calculateTotals();

  const productOptions = products.map((product: Product) => ({
    value: product.id,
    label: product.name,
  }));

  const emptyMaterial = {
    id: `new-material-${Date.now()}`,
    taskId: '',
    name: '',
    quantity: 1,
    unitPrice: 0,
    productId: null,
  };

  return (
    <>
      <Head>
        <title>Edit Quote | Construction Quote Manager</title>
      </Head>

      <div className="container mx-auto px-4 py-6">
        <Breadcrumbs className="mb-6">
          <BreadcrumbItem href="/admin">Dashboard</BreadcrumbItem>
          <BreadcrumbItem href="/admin/quotes">Quotes</BreadcrumbItem>
          <BreadcrumbItem>Edit Quote</BreadcrumbItem>
        </Breadcrumbs>

        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button isIconOnly variant="light" onPress={() => router.back()} aria-label="Go back">
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-2xl font-bold">Edit Quote</h1>
            </div>
            <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting}>
              Update Quote
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Quote Details */}
            <Card className="border-none shadow-none lg:col-span-2">
              <CardHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">Quote Details</h2>
              </CardHeader>
              <CardBody className="border-none">
                <div className="space-y-4">
                  <Input
                    label="Quote Title"
                    name="title"
                    value={quoteFormData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Quote for..."
                    required
                    aria-label="Quote title"
                    radius="none"
                    classNames={{
                      inputWrapper: 'border-none',
                    }}
                  />

                  <Input
                    label="Customer Name"
                    name="customerName"
                    value={quoteFormData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder="Customer name"
                    required
                    aria-label="Customer name"
                    radius="none"
                    classNames={{
                      inputWrapper: 'border-none',
                    }}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label="Customer Email"
                      name="customerEmail"
                      value={quoteFormData.customerEmail || ''}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      placeholder="customer@example.com"
                      type="email"
                      aria-label="Customer email"
                      radius="none"
                      classNames={{
                        inputWrapper: 'border-none',
                      }}
                    />

                    <Input
                      label="Customer Phone"
                      name="customerPhone"
                      value={quoteFormData.customerPhone || ''}
                      onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      aria-label="Customer phone"
                      radius="none"
                      classNames={{
                        inputWrapper: 'border-none',
                      }}
                    />
                  </div>

                  <Textarea
                    label="Notes"
                    name="notes"
                    value={quoteFormData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes..."
                    aria-label="Quote notes"
                    radius="none"
                    classNames={{
                      inputWrapper: 'border-none',
                    }}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Tasks */}
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Tasks</h2>
                <Button
                  color="primary"
                  size="sm"
                  startContent={<Plus size={16} />}
                  onPress={addTask}
                >
                  Add Task
                </Button>
              </div>

              {tasks.map((task: Task, index: number) => (
                <Card key={task.id} className="mb-4">
                  <CardBody>
                    <div className="mb-4 flex items-start justify-between">
                      <h3 className="text-lg font-medium">Task {index + 1}</h3>
                      <Button
                        isIconOnly
                        variant="light"
                        color="danger"
                        size="sm"
                        onPress={() => removeTask(index)}
                        aria-label={`Remove task ${index + 1}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <Textarea
                        label="Description"
                        value={task.description}
                        onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                        placeholder="Task description"
                        aria-label="Task description"
                      />

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <NumberInput
                          label="Price"
                          value={parseFloat(task.price.toString())}
                          onValueChange={(value) => handleTaskChange(index, 'price', value)}
                          min={0}
                          step={0.01}
                          startContent="$"
                          formatOptions={{
                            style: 'decimal',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }}
                        />

                        <NumberInput
                          label="Order"
                          value={task.order}
                          onValueChange={(value) => handleTaskChange(index, 'order', value)}
                          min={0}
                          step={1}
                        />
                      </div>

                      <Divider />

                      <div>
                        <p className="mb-2 text-sm font-medium">Materials</p>
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            color={task.materialType === 'lumpsum' ? 'primary' : 'default'}
                            variant={task.materialType === 'lumpsum' ? 'solid' : 'flat'}
                            onPress={() => handleTaskMaterialTypeChange(index, 'lumpsum')}
                            className="w-full"
                          >
                            Lump Sum
                          </Button>

                          <Button
                            color={task.materialType === 'itemized' ? 'primary' : 'default'}
                            variant={task.materialType === 'itemized' ? 'solid' : 'flat'}
                            onPress={() => handleTaskMaterialTypeChange(index, 'itemized')}
                            className="w-full"
                          >
                            Itemized
                          </Button>
                        </div>
                      </div>

                      {task.materialType === 'lumpsum' ? (
                        <NumberInput
                          label="Estimated Materials Cost"
                          value={task.estimatedMaterialsCostLumpSum || 0}
                          onValueChange={(value) =>
                            handleTaskChange(index, 'estimatedMaterialsCostLumpSum', value)
                          }
                          min={0}
                          step={0.01}
                          startContent="$"
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
                              onPress={() => openMaterialModal(index)}
                            >
                              Add Material
                            </Button>
                          </div>

                          {task.materials &&
                            task.materials.map((material, materialIndex) => (
                              <div
                                key={material.id}
                                className="flex items-center justify-between rounded bg-gray-50 p-2"
                              >
                                <div>
                                  <p className="font-medium">{material.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {material.quantity} x ${formatCurrency(material.unitPrice)} = $
                                    {formatCurrency(material.quantity * material.unitPrice)}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="light"
                                    onPress={() => openMaterialModal(index, materialIndex)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    onPress={() => removeMaterial(index, materialIndex)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ))}

                          {(!task.materials || task.materials.length === 0) && (
                            <div className="rounded border border-dashed p-4 text-center text-gray-500">
                              No materials added yet.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}

              {tasks.length === 0 && (
                <div className="rounded border border-dashed p-8 text-center text-gray-500">
                  No tasks added yet. Click "Add Task" to get started.
                </div>
              )}
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
                        <p className="text-gray-500">Tasks Subtotal:</p>
                        <p className="font-medium">{formatCurrency(totals.subtotalTasks)}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-gray-500">Materials Subtotal:</p>
                        <p className="font-medium">{formatCurrency(totals.subtotalMaterials)}</p>
                      </div>

                      <Divider />

                      <NumberInput
                        label="Complexity Charge (%)"
                        value={quoteFormData.complexityPercentage}
                        onValueChange={(value) => handleInputChange('complexityPercentage', value)}
                        min={0}
                        step={0.1}
                        endContent="%"
                        formatOptions={{
                          style: 'decimal',
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        }}
                      />

                      <div className="flex items-center justify-between text-sm">
                        <p className="text-gray-500">Complexity Amount:</p>
                        <p>{formatCurrency(totals.complexityCharge)}</p>
                      </div>

                      <NumberInput
                        label="Markup Charge (%)"
                        value={quoteFormData.markupPercentage}
                        onValueChange={(value) => handleInputChange('markupPercentage', value)}
                        min={0}
                        step={0.1}
                        endContent="%"
                        formatOptions={{
                          style: 'decimal',
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        }}
                      />

                      <div className="flex items-center justify-between text-sm">
                        <p className="text-gray-500">Markup Amount:</p>
                        <p>{formatCurrency(totals.markupCharge)}</p>
                      </div>

                      <Divider />

                      <div className="flex items-center justify-between">
                        <p className="font-bold">Grand Total:</p>
                        <p className="text-xl font-bold">{formatCurrency(totals.grandTotal)}</p>
                      </div>

                      <Button
                        color="primary"
                        className="w-full"
                        onPress={handleSubmit}
                        isLoading={isSubmitting}
                        isDisabled={isSubmitting}
                      >
                        Update Quote
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Material Modal */}
      <MaterialModal
        isOpen={materialModalIsOpen}
        onOpenChange={setMaterialModalIsOpen}
        initialMaterial={
          selectedMaterialIndex !== null && selectedTaskIndex !== null
            ? tasks[selectedTaskIndex]?.materials[selectedMaterialIndex] || {}
            : {}
        }
        isEditing={selectedMaterialIndex !== null}
        taskIndex={selectedTaskIndex}
        onSaveMaterial={handleSaveMaterial}
      />
    </>
  );
}
