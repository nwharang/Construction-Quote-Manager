import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
} from '@heroui/react';
import { api } from '~/utils/api';
import { useAppToast } from '~/components/providers/ToastProvider';
import { useTranslation } from '~/hooks/useTranslation';
import type { RouterOutputs } from '~/utils/api';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '~/server/api/root';

type Quote = RouterOutputs['quote']['getById'] & {
  tasks: Task[];
};

type QuoteStatus = Quote['status'];

interface Task {
  id: string;
  name: string;
  description: string | null;
  price: string;
  quantity: number;
  materialType: 'itemized' | 'lumpsum';
  estimatedMaterialsCostLumpSum: string;
  materials: Material[];
}

interface Material {
  id: string;
  name: string;
  description: string | null;
  price: string;
  quantity: number;
}

export default function EditQuotePage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: authStatus } = useSession();
  const toast = useAppToast();
  const { formatCurrency } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
    complexityCharge: '0',
    markupCharge: '0',
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);

  // Fetch quote details
  const quoteQuery = api.quote.getById.useQuery(
    { id: id as string },
    { enabled: !!id && authStatus === 'authenticated' }
  );

  // Update quote mutation
  const updateQuoteMutation = api.quote.update.useMutation({
    onSuccess: () => {
      toast.success('Quote updated successfully');
      router.push(`/admin/quotes/${id}`);
    },
    onError: (err: TRPCClientErrorLike<AppRouter>) => {
      toast.error(`Error updating quote: ${err.message}`);
    },
  });

  // Update task mutation
  const updateTaskMutation = api.task.update.useMutation({
    onSuccess: () => {
      toast.success('Task updated successfully');
    },
    onError: (err: TRPCClientErrorLike<AppRouter>) => {
      toast.error(`Error updating task: ${err.message}`);
    },
  });

  // Update material mutation
  const updateMaterialMutation = api.material.update.useMutation({
    onSuccess: () => {
      toast.success('Material updated successfully');
    },
    onError: (err: TRPCClientErrorLike<AppRouter>) => {
      toast.error(`Error updating material: ${err.message}`);
    },
  });

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (quoteQuery.data) {
      const quote = quoteQuery.data as Quote;
      setFormData({
        title: quote.title,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail ?? '',
        customerPhone: quote.customerPhone ?? '',
        notes: quote.notes ?? '',
        complexityCharge: quote.complexityCharge,
        markupCharge: quote.markupCharge,
      });
      
      // Safely handle tasks data
      if (quote.tasks && Array.isArray(quote.tasks)) {
        // Ensure each task has a materials array and materialType
        const safeTasksWithMaterials = quote.tasks.map(task => {
          // Get estimatedMaterialsCost safely with type assertion
          const estimatedCost = (task as any).estimatedMaterialsCost || '0';
          
          return {
            ...task,
            materialType: 'itemized' as const, // Explicitly type as 'itemized'
            estimatedMaterialsCostLumpSum: estimatedCost,
            materials: Array.isArray(task.materials) ? task.materials : []
          };
        });
        
        setTasks(safeTasksWithMaterials);
      } else {
        // Initialize with empty array if no tasks
        setTasks([]);
      }
    }
  }, [quoteQuery.data]);

  const formatCurrencyInput = (value: string) => {
    const number = parseFloat(value.replace(/[^0-9.-]+/g, ''));
    return isNaN(number) ? '0' : number.toFixed(2);
  };

  const calculateTotals = () => {
    let subtotalTasks = 0;
    let subtotalMaterials = 0;
    
    // Safely handle undefined tasks
    if (!tasks || tasks.length === 0) {
      // Return just the charges if there are no tasks
      const complexityCharge = Number(formData?.complexityCharge || 0);
      const markupCharge = Number(formData?.markupCharge || 0);
      return complexityCharge + markupCharge;
    }
    
    // Process tasks and their prices
    tasks.forEach((task) => {
      // Add task price * quantity to subtotalTasks
      subtotalTasks += Number(task.price || 0) * (task.quantity || 1);
      
      // Handle different material types
      if (task.materialType === 'lumpsum') {
        // For lumpsum, directly add the estimated materials cost
        subtotalMaterials += Number(task.estimatedMaterialsCostLumpSum || 0);
      } else if (task.materialType === 'itemized' && task.materials && task.materials.length > 0) {
        // For itemized, calculate the sum of all materials (price * quantity)
        task.materials.forEach((material) => {
          subtotalMaterials += Number(material.price || 0) * (material.quantity || 1);
        });
      }
    });
    
    // Add additional charges
    const complexityCharge = Number(formData?.complexityCharge || 0);
    const markupCharge = Number(formData?.markupCharge || 0);
    
    // Calculate the final total
    const grandTotal = subtotalTasks + subtotalMaterials + complexityCharge + markupCharge;
    
    return grandTotal;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('Charge') ? formatCurrencyInput(value) : value,
    }));
  };

  const handleTaskChange = (taskId: string, field: keyof Task, value: string | number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              [field]: field === 'price' || field === 'estimatedMaterialsCostLumpSum' 
                ? formatCurrencyInput(value as string) 
                : value,
            }
          : task
      )
    );
  };

  const handleMaterialChange = (
    taskId: string,
    materialId: string,
    field: keyof Material,
    value: string | number
  ) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              materials: task.materials.map((material) =>
                material.id === materialId
                  ? {
                      ...material,
                      [field]: field === 'price' ? formatCurrencyInput(value as string) : value,
                    }
                  : material
              ),
            }
          : task
      )
    );
  };

  const addTask = () => {
    setTasks((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        name: '',
        description: '',
        price: '0',
        quantity: 1,
        materialType: 'itemized',
        estimatedMaterialsCostLumpSum: '0',
        materials: [],
      },
    ]);
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const addMaterial = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              materials: [
                ...task.materials,
                {
                  id: String(task.materials.length + 1),
                  name: '',
                  description: '',
                  price: '0',
                  quantity: 1,
                },
              ],
            }
          : task
      )
    );
  };

  const removeMaterial = (taskId: string, materialId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              materials: task.materials.filter((material) => material.id !== materialId),
            }
          : task
      )
    );
  };

  const handleSaveMaterial = () => {
    if (!currentTask || !currentMaterial) return;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === currentTask.id
          ? {
              ...task,
              materials: task.materials.map((material) =>
                material.id === currentMaterial.id ? currentMaterial : material
              ),
            }
          : task
      )
    );

    onClose();
  };

  const handleSubmit = async () => {
    if (!session?.user?.id || !quoteQuery.data) return;

    // Validate required fields
    if (!formData.title || !formData.customerName) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Ensure tasks is an array before validation
    if (!tasks || !Array.isArray(tasks)) {
      toast.error('No tasks available. Please add at least one task or try refreshing the page.');
      return;
    }

    // Validate tasks
    for (const task of tasks) {
      if (!task.name) {
        toast.error('All tasks must have a name');
        return;
      }
    }

    setIsLoading(true);

    try {
      // Update quote first
      await updateQuoteMutation.mutateAsync({
        id: quoteQuery.data.id,
        title: formData.title,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || undefined,
        customerPhone: formData.customerPhone || undefined,
        notes: formData.notes || undefined,
      });

      // Skip task and material updates if tasks array is empty
      if (tasks.length > 0) {
        // Update tasks - handle each task update individually with error handling
        for (const task of tasks) {
          try {
            // Calculate materials cost based on material type
            const estimatedMaterialsCost = task.materialType === 'lumpsum' 
              ? Number(task.estimatedMaterialsCostLumpSum)
              : task.materials && Array.isArray(task.materials) 
                ? task.materials.reduce(
                    (sum, material) => sum + Number(material.price) * material.quantity,
                    0
                  )
                : 0;
                
            await updateTaskMutation.mutateAsync({
              id: task.id,
              description: task.name, // Use task name as description
              price: Number(task.price),
              estimatedMaterialsCost: estimatedMaterialsCost,
              order: tasks.indexOf(task),
            });
            
            // Update materials for the task if they exist and it's an itemized task
            if (task.materialType === 'itemized' && task.materials && Array.isArray(task.materials) && task.materials.length > 0) {
              for (const material of task.materials) {
                try {
                  await updateMaterialMutation.mutateAsync({
                    id: material.id,
                    notes: material.description ?? undefined,
                    unitPrice: Number(material.price),
                    quantity: material.quantity,
                  });
                } catch (materialError) {
                  console.error('Error updating material:', materialError);
                  toast.error(`Failed to update material: ${material.name}`);
                  // Continue with other materials
                }
              }
            }
          } catch (taskError) {
            console.error('Error updating task:', taskError);
            toast.error(`Failed to update task: ${task.name}`);
            // Continue with other tasks
          }
        }
      }

      // Success - navigate back to the quote detail page
      toast.success('Quote updated successfully');
      router.push(`/admin/quotes/${id}`);
    } catch (error) {
      console.error('Error updating quote:', error);
      toast.error('Failed to update quote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authStatus === 'loading' || quoteQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!quoteQuery.data) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-danger mb-4">Quote not found</p>
          <Button color="primary" variant="light" onPress={() => router.push('/admin/quotes')}>
            Back to Quotes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Quote #{id} | Construction Quote Manager</title>
      </Head>

      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Quote</h1>
            <p className="text-muted-foreground">Update quote details</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Input
                label="Quote Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Customer Name"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Customer Email"
                name="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={handleInputChange}
              />
              <Input
                label="Customer Phone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
              />
              <Textarea
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-4">
              <Input
                label="Complexity Charge"
                name="complexityCharge"
                value={formData.complexityCharge}
                onChange={handleInputChange}
                startContent="$"
              />
              <Input
                label="Markup Charge"
                name="markupCharge"
                value={formData.markupCharge}
                onChange={handleInputChange}
                startContent="$"
              />
              <div className="p-4 bg-background/50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Total</h3>
                <p className="text-2xl font-bold">{formatCurrency(calculateTotals())}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Tasks</h2>
              <Button
                color="primary"
                startContent={<Plus size={20} />}
                onPress={addTask}
                isDisabled={isLoading}
              >
                Add Task
              </Button>
            </div>

            {(!tasks || tasks.length === 0) ? (
              <div className="p-6 text-center border border-dashed rounded-lg">
                <p className="text-muted-foreground">No tasks added yet. Click &quot;Add Task&quot; to get started.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-4 flex-1">
                      <Input
                        label="Task Name"
                        value={task.name}
                        onChange={(e) => handleTaskChange(task.id, 'name', e.target.value)}
                        required
                      />
                      <Textarea
                        label="Description"
                        value={task.description ?? ''}
                        onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Price"
                          value={task.price}
                          onChange={(e) => handleTaskChange(task.id, 'price', e.target.value)}
                          startContent="$"
                        />
                        <Input
                          label="Quantity"
                          type="number"
                          value={task.quantity.toString()}
                          onChange={(e) => handleTaskChange(task.id, 'quantity', Number(e.target.value))}
                          min={1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Material Type</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={task.materialType === 'itemized'}
                              onChange={() => handleTaskChange(task.id, 'materialType', 'itemized')}
                              className="form-radio"
                            />
                            <span>Itemized Materials</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={task.materialType === 'lumpsum'}
                              onChange={() => handleTaskChange(task.id, 'materialType', 'lumpsum')}
                              className="form-radio"
                            />
                            <span>Lump Sum</span>
                          </label>
                        </div>
                      </div>
                      
                      {task.materialType === 'lumpsum' && (
                        <Input
                          label="Estimated Materials Cost"
                          value={task.estimatedMaterialsCostLumpSum}
                          onChange={(e) => handleTaskChange(task.id, 'estimatedMaterialsCostLumpSum', e.target.value)}
                          startContent="$"
                        />
                      )}
                    </div>
                    <Button
                      isIconOnly
                      color="danger"
                      variant="light"
                      onPress={() => removeTask(task.id)}
                      isDisabled={isLoading}
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>

                  {task.materialType === 'itemized' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Materials</h3>
                        <Button
                          color="primary"
                          variant="flat"
                          startContent={<Plus size={20} />}
                          onPress={() => addMaterial(task.id)}
                          isDisabled={isLoading}
                        >
                          Add Material
                        </Button>
                      </div>

                      {(!task.materials || task.materials.length === 0) ? (
                        <div className="p-4 text-center bg-background/30 border-dashed border rounded-lg">
                          <p className="text-muted-foreground text-sm">No materials added yet.</p>
                        </div>
                      ) : (
                        task.materials.map((material) => (
                          <div key={material.id} className="p-4 bg-background/50 rounded-lg space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-4 flex-1">
                                <Input
                                  label="Material Name"
                                  value={material.name}
                                  onChange={(e) =>
                                    handleMaterialChange(task.id, material.id, 'name', e.target.value)
                                  }
                                  required
                                />
                                <Textarea
                                  label="Description"
                                  value={material.description ?? ''}
                                  onChange={(e) =>
                                    handleMaterialChange(task.id, material.id, 'description', e.target.value)
                                  }
                                />
                                <div className="grid grid-cols-2 gap-4">
                                  <Input
                                    label="Price"
                                    value={material.price}
                                    onChange={(e) =>
                                      handleMaterialChange(task.id, material.id, 'price', e.target.value)
                                    }
                                    startContent="$"
                                  />
                                  <Input
                                    label="Quantity"
                                    type="number"
                                    value={material.quantity.toString()}
                                    onChange={(e) =>
                                      handleMaterialChange(
                                        task.id,
                                        material.id,
                                        'quantity',
                                        Number(e.target.value)
                                      )
                                    }
                                    min={1}
                                  />
                                </div>
                              </div>
                              <Button
                                isIconOnly
                                color="danger"
                                variant="light"
                                onPress={() => removeMaterial(task.id, material.id)}
                                isDisabled={isLoading}
                              >
                                <Trash2 size={20} />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              color="danger"
              variant="light"
              onPress={() => router.back()}
              isDisabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isLoading}
              startContent={isLoading ? <Loader2 className="animate-spin" /> : undefined}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
