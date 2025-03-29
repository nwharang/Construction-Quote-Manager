import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Plus, X, Save, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Select,
  SelectItem,
  Divider,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Breadcrumbs,
  BreadcrumbItem,
  NumberInput,
  useDisclosure,
} from '@heroui/react';
import { api } from '~/utils/api';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '~/server/api/root';
import { useAppToast } from '~/components/providers/ToastProvider';
import { useTranslation } from '~/hooks/useTranslation';
import type { RouterOutputs } from '~/utils/api';

interface Product {
  id: string;
  name: string;
  unitPrice: string;
}

interface Material {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  notes?: string;
}

interface Task {
  id: string;
  description: string;
  price: string;
  materialType: 'itemized' | 'lumpsum';
  estimatedMaterialsCostLumpSum: string;
  materials: Material[];
}

export default function NewQuotePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const toast = useAppToast();
  const { formatCurrency } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Add tRPC mutation hooks at the top

  const createTaskMutation = api.task.create.useMutation();
  const createMaterialMutation = api.material.create.useMutation();
  const createQuoteMutation = api.quote.create.useMutation({
    onSuccess: async (data) => {
      // After quote is created, create tasks
      try {
        for (const task of tasks) {
          const taskResult = await createTaskMutation.mutateAsync({
            quoteId: data.id,
            description: task.description,
            price: parseFloat(task.price),
            estimatedMaterialsCost:
              task.materialType === 'lumpsum'
                ? parseFloat(task.estimatedMaterialsCostLumpSum)
                : task.materials.reduce(
                    (sum, material) => sum + parseFloat(material.unitPrice) * material.quantity,
                    0
                  ),
          });

          // If task has itemized materials, create them
          if (task.materialType === 'itemized' && task.materials.length > 0) {
            for (const material of task.materials) {
              await createMaterialMutation.mutateAsync({
                taskId: taskResult.id,
                productId: material.productId,
                quantity: material.quantity,
                unitPrice: parseFloat(material.unitPrice),
                notes: material.notes,
              });
            }
          }
        }
        toast.success('Quote created successfully');
        router.push('/admin/quotes');
      } catch (error) {
        console.error('Error creating tasks:', error);
        toast.error('Failed to create tasks');
      }
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      console.error('Error creating quote:', error);
      toast.error(`Failed to create quote: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
    complexityCharge: '0.00',
    markupCharge: '0.00',
  });

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      description: '',
      price: '0.00',
      materialType: 'lumpsum',
      estimatedMaterialsCostLumpSum: '0.00',
      materials: [],
    },
  ]);

  // Material modal state
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentMaterial, setCurrentMaterial] = useState<Material>({
    id: '',
    productId: '',
    quantity: 1,
    unitPrice: '0.00',
    notes: '',
  });
  const [editingMaterialIndex, setEditingMaterialIndex] = useState<number | null>(null);

  // Fetch available products
  const { data: productData } = api.product.getAll.useQuery(
    {},
    {
      enabled: status === 'authenticated',
    }
  );

  const products = productData?.items ?? [];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Loading state
  if (status === 'loading' || !mounted) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Helper to format currency input
  const formatCurrencyInput = (value: string) => {
    const num = parseFloat(value.replace(/[^\d.]/g, ''));
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Calculate totals
  const calculateTotals = () => {
    let subtotalTasks = 0;
    let subtotalMaterials = 0;

    tasks.forEach((task) => {
      subtotalTasks += parseFloat(task.price);

      if (task.materialType === 'lumpsum') {
        subtotalMaterials += parseFloat(task.estimatedMaterialsCostLumpSum);
      } else {
        task.materials.forEach((material) => {
          subtotalMaterials += parseFloat(material.unitPrice) * material.quantity;
        });
      }
    });

    const complexityCharge = parseFloat(formData.complexityCharge) || 0;
    const markupCharge = parseFloat(formData.markupCharge) || 0;
    const grandTotal = subtotalTasks + subtotalMaterials + complexityCharge + markupCharge;

    return {
      subtotalTasks: subtotalTasks.toFixed(2),
      subtotalMaterials: subtotalMaterials.toFixed(2),
      complexityCharge: complexityCharge.toFixed(2),
      markupCharge: markupCharge.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
  };

  const totals = calculateTotals();

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'complexityCharge' || name === 'markupCharge') {
      setFormData({
        ...formData,
        [name]: formatCurrencyInput(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle task input change
  const handleTaskChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newTasks = [...tasks];
    const task = newTasks[index];

    if (!task) return;

    if (name === 'price' || name === 'estimatedMaterialsCostLumpSum') {
      newTasks[index] = {
        ...task,
        [name]: formatCurrencyInput(value),
      };
    } else if (name === 'materialType') {
      newTasks[index] = {
        ...task,
        materialType: value as 'lumpsum' | 'itemized',
      };
    } else {
      newTasks[index] = {
        ...task,
        [name]: value,
      };
    }

    setTasks(newTasks);
  };

  // Add a new task
  const addTask = () => {
    setTasks([
      ...tasks,
      {
        id: Date.now().toString(),
        description: '',
        price: '0.00',
        materialType: 'lumpsum',
        estimatedMaterialsCostLumpSum: '0.00',
        materials: [],
      },
    ]);
  };

  // Remove a task
  const removeTask = (index: number) => {
    if (tasks.length === 1) {
      // Don't remove the last task, just reset it
      setTasks([
        {
          id: Date.now().toString(),
          description: '',
          price: '0.00',
          materialType: 'lumpsum',
          estimatedMaterialsCostLumpSum: '0.00',
          materials: [],
        },
      ]);
    } else {
      const newTasks = [...tasks];
      newTasks.splice(index, 1);
      setTasks(newTasks);
    }
  };

  // Open material modal
  const openMaterialModal = (taskIndex: number, materialIndex?: number) => {
    setCurrentTaskIndex(taskIndex);

    if (materialIndex !== undefined) {
      setEditingMaterialIndex(materialIndex);
      const materials = tasks[taskIndex]?.materials || [];
      const material = materials[materialIndex];
      if (material) {
        setCurrentMaterial({ ...material });
      }
    } else {
      setEditingMaterialIndex(null);
      setCurrentMaterial({
        id: '',
        productId: '',
        quantity: 1,
        unitPrice: '0.00',
        notes: '',
      });
    }

    setShowMaterialModal(true);
  };

  // Handle material input change
  const handleMaterialChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | { target: { name: string; value: string | number } }
  ) => {
    const { name, value } = e.target;

    if (name === 'quantity') {
      setCurrentMaterial({
        ...currentMaterial,
        [name]: typeof value === 'string' ? parseInt(value) || 1 : value,
      });
    } else if (name === 'unitPrice') {
      setCurrentMaterial({
        ...currentMaterial,
        [name]: typeof value === 'string' ? formatCurrencyInput(value) : value.toString(),
      });
    } else {
      setCurrentMaterial({
        ...currentMaterial,
        [name]: value.toString(),
      });
    }
  };

  // Save material
  const saveMaterial = () => {
    const newTasks = [...tasks];
    const task = newTasks[currentTaskIndex];

    if (!task) return;

    if (editingMaterialIndex !== null) {
      task.materials[editingMaterialIndex] = currentMaterial;
    } else {
      task.materials.push(currentMaterial);
    }

    setTasks(newTasks);
    setShowMaterialModal(false);
  };

  // Remove material
  const removeMaterial = (taskIndex: number, materialIndex: number) => {
    const newTasks = [...tasks];
    const task = newTasks[taskIndex];

    if (!task) return;

    task.materials.splice(materialIndex, 1);
    setTasks(newTasks);
  };

  // Material display in task card
  const getMaterialDisplay = (material: Material) => {
    const product = products.find((p: Product) => p.id === material.productId);
    return {
      name: product?.name ?? 'Unknown Product',
      total: (material.quantity * parseFloat(material.unitPrice)).toFixed(2),
    };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create quote using tRPC mutation
      createQuoteMutation.mutate({
        title: formData.title,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || undefined,
        customerPhone: formData.customerPhone || undefined,
        notes: formData.notes || undefined,
      });
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Failed to create quote');
    }
  };

  return (
    <div className="container mx-auto px-4">
      {/* Breadcrumbs */}
      <Breadcrumbs className="mb-6">
        <BreadcrumbItem>
          <Button
            variant="light"
            startContent={<ArrowLeft size={16} />}
            onPress={() => router.push('/admin/quotes')}
          >
            Back to Quotes
          </Button>
        </BreadcrumbItem>
      </Breadcrumbs>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Quote</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new construction quote</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Quote Details */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-bold">Quote Details</h2>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <Input
              label="Quote Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              isRequired
            />
            <Input
              label="Customer Name"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              isRequired
            />
            <Input
              type="email"
              label="Customer Email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleInputChange}
            />
            <Input
              type="tel"
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
              minRows={3}
            />
          </CardBody>
        </Card>

        {/* Tasks */}
        <Card className="mb-6">
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Tasks</h2>
            <Button color="primary" startContent={<Plus size={16} />} onPress={addTask}>
              Add Task
            </Button>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-6">
              {tasks.map((task, index) => (
                <Card key={task.id}>
                  <CardBody>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">Task {index + 1}</h3>
                      <Button
                        isIconOnly
                        color="danger"
                        variant="light"
                        onPress={() => removeTask(index)}
                      >
                        <X size={20} />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <Textarea
                        label="Description"
                        name="description"
                        value={task.description}
                        onChange={(e) => handleTaskChange(index, e)}
                        minRows={2}
                        isRequired
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <NumberInput
                          label="Task Price"
                          name="price"
                          value={parseFloat(task.price)}
                          onValueChange={(value) => {
                            const newTasks = [...tasks];
                            const task = newTasks[index];
                            if (!task) return;

                            newTasks[index] = {
                              ...task,
                              price: formatCurrencyInput(value.toString()),
                            };
                            setTasks(newTasks);
                          }}
                          startContent={<span className="text-gray-500">$</span>}
                          isRequired
                          min={0}
                          step={0.01}
                        />

                        <Select
                          label="Materials Type"
                          name="materialType"
                          selectedKeys={[task.materialType]}
                          onSelectionChange={(keys) => {
                            const key = Array.from(keys)[0];
                            handleTaskChange(index, {
                              target: { name: 'materialType', value: key as string },
                            } as React.ChangeEvent<HTMLSelectElement>);
                          }}
                        >
                          <SelectItem key="lumpsum">Lump Sum</SelectItem>
                          <SelectItem key="itemized">Itemized</SelectItem>
                        </Select>
                      </div>

                      {task.materialType === 'lumpsum' ? (
                        <NumberInput
                          type="text"
                          label="Estimated Materials Cost (Lump Sum)"
                          name="estimatedMaterialsCostLumpSum"
                          value={parseFloat(task.estimatedMaterialsCostLumpSum)}
                          onValueChange={(value) => {
                            const newTasks = [...tasks];
                            const task = newTasks[index];
                            if (!task) return;

                            newTasks[index] = {
                              ...task,
                              estimatedMaterialsCostLumpSum: formatCurrencyInput(value.toString()),
                            };
                            setTasks(newTasks);
                          }}
                          startContent={<span className="text-gray-500">$</span>}
                          min={0}
                          step={0.01}
                        />
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium">Materials</h4>
                            <Button
                              size="sm"
                              variant="light"
                              color="primary"
                              startContent={<Plus size={16} />}
                              onPress={() => openMaterialModal(index)}
                            >
                              Add Material
                            </Button>
                          </div>

                          {task.materials.length > 0 ? (
                            <div className="space-y-2">
                              {task.materials.map((material, materialIndex) => {
                                const display = getMaterialDisplay(material);
                                return (
                                  <Card key={material.id}>
                                    <CardBody>
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium">{display.name}</p>
                                          <p className="text-sm text-gray-600">
                                            {material.quantity} x ${material.unitPrice} = $
                                            {display.total}
                                          </p>
                                          {material.notes && (
                                            <p className="text-sm text-gray-500 mt-1">
                                              {material.notes}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            isIconOnly
                                            variant="light"
                                            onPress={() => openMaterialModal(index, materialIndex)}
                                          >
                                            <Edit size={16} />
                                          </Button>
                                          <Button
                                            isIconOnly
                                            variant="light"
                                            color="danger"
                                            onPress={() => removeMaterial(index, materialIndex)}
                                          >
                                            <X size={16} />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardBody>
                                  </Card>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-center py-4 text-gray-500">No materials added yet</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Adjustments and Totals */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-bold">Adjustments & Totals</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Adjustments */}
              <Card>
                <CardHeader>
                  <h3 className="text-md font-bold">Adjustments</h3>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4">
                  <NumberInput
                    label="Complexity Charge"
                    name="complexityCharge"
                    value={parseFloat(formData.complexityCharge)}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        complexityCharge: formatCurrencyInput(value.toString()),
                      });
                    }}
                    startContent={<span className="text-gray-500">$</span>}
                    min={0}
                    step={0.01}
                  />
                  <NumberInput
                    label="Markup Charge"
                    name="markupCharge"
                    value={parseFloat(formData.markupCharge)}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        markupCharge: formatCurrencyInput(value.toString()),
                      });
                    }}
                    startContent={<span className="text-gray-500">$</span>}
                    min={0}
                    step={0.01}
                  />
                </CardBody>
              </Card>

              {/* Totals */}
              <Card>
                <CardHeader>
                  <h3 className="text-md font-bold">Totals</h3>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tasks Subtotal:</span>
                    <span>${totals.subtotalTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Materials Subtotal:</span>
                    <span>${totals.subtotalMaterials}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Complexity Charge:</span>
                    <span>${totals.complexityCharge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Markup Charge:</span>
                    <span>${totals.markupCharge}</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total:</span>
                    <span>${totals.grandTotal}</span>
                  </div>
                </CardBody>
              </Card>
            </div>
          </CardBody>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            color="primary"
            size="lg"
            startContent={<Save size={20} />}
            className="w-full md:w-auto"
          >
            Save Quote
          </Button>
        </div>
      </form>

      {/* Material Modal */}
      <Modal isOpen={showMaterialModal} onClose={() => setShowMaterialModal(false)}>
        <ModalContent>
          <ModalHeader>
            {editingMaterialIndex !== null ? 'Edit Material' : 'Add Material'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Product"
                selectedKeys={currentMaterial.productId ? [currentMaterial.productId] : []}
                onChange={(e) => {
                  const product = products.find((p: Product) => p.id === e.target.value);
                  if (product) {
                    handleMaterialChange({
                      target: { name: 'productId', value: product.id },
                    });
                    handleMaterialChange({
                      target: { name: 'unitPrice', value: parseFloat(product.unitPrice) },
                    });
                  }
                }}
                name="productId"
                required
              >
                {[
                  <SelectItem key="placeholder" className="text-gray-500">
                    Select a product
                  </SelectItem>,
                  ...products.map((product: Product) => (
                    <SelectItem key={product.id} className="text-gray-900">
                      {product.name} - ${product.unitPrice}
                    </SelectItem>
                  )),
                ]}
              </Select>

              <NumberInput
                label="Quantity"
                value={currentMaterial.quantity}
                onValueChange={(value) =>
                  handleMaterialChange({
                    target: { name: 'quantity', value },
                  })
                }
                min={1}
                required
              />

              <NumberInput
                label="Unit Price"
                value={parseFloat(currentMaterial.unitPrice)}
                onValueChange={(value) =>
                  handleMaterialChange({
                    target: { name: 'unitPrice', value },
                  })
                }
                min={0}
                step={0.01}
                required
              />

              <Textarea
                label="Notes"
                value={currentMaterial.notes ?? ''}
                onChange={(e) => handleMaterialChange(e)}
                name="notes"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowMaterialModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={saveMaterial}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
