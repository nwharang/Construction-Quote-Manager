import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save, Plus, Trash } from 'lucide-react';
import { api } from '~/utils/api';
import { Button, Card, CardBody, Input, Textarea, Spinner } from '@heroui/react';
import { useAppToast } from '~/components/providers/ToastProvider';

export default function EditQuotePage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const toast = useAppToast();

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
  const [tasks, setTasks] = useState<any[]>([]);

  // Material modal state
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentMaterial, setCurrentMaterial] = useState({
    id: '',
    description: '',
    quantity: 1,
    cost: '0.00',
  });
  const [editingMaterialIndex, setEditingMaterialIndex] = useState<number | null>(null);

  // Fetch quote data using tRPC
  const { data: quote, isLoading: isLoadingQuote } = api.quote.getById.useQuery(
    { id: id as string },
    { enabled: !!id && status === 'authenticated' }
  );

  // Update mutation
  const updateQuoteMutation = api.quote.update.useMutation({
    onSuccess: () => {
      toast.success('Quote updated successfully');
      router.push('/admin/quotes');
    },
    onError: (error) => {
      toast.error(`Error updating quote: ${error.message}`);
    },
  });

  // Set initial form data when quote is loaded
  useEffect(() => {
    if (quote) {
      setFormData({
        title: quote.title,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail || '',
        customerPhone: quote.customerPhone || '',
        notes: quote.notes || '',
        complexityCharge: quote.complexityCharge.toString(),
        markupCharge: quote.markupCharge.toString(),
      });

      setTasks(
        quote.tasks.map((task) => ({
          ...task,
          materials: task.materials || [],
        }))
      );
    }
  }, [quote]);

  // Loading state
  if (status === 'loading' || isLoadingQuote) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Error state
  if (!quote) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-danger mb-4">Quote not found</h1>
          <Button color="primary" variant="light" onClick={() => router.push('/admin/quotes')}>
            Return to quotes list
          </Button>
        </div>
      </div>
    );
  }

  // Helper to format currency input
  const formatCurrency = (value: string) => {
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
        task.materials.forEach((material: any) => {
          subtotalMaterials += parseFloat(material.cost) * material.quantity;
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'complexityCharge' || name === 'markupCharge') {
      setFormData({
        ...formData,
        [name]: formatCurrency(value),
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

    if (name === 'price' || name === 'estimatedMaterialsCostLumpSum') {
      newTasks[index] = {
        ...newTasks[index],
        [name]: formatCurrency(value),
      };
    } else {
      newTasks[index] = {
        ...newTasks[index],
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
        description: '',
        price: '0.00',
        materialType: 'itemized',
        estimatedMaterialsCostLumpSum: '0.00',
        materials: [],
      },
    ]);
  };

  // Remove a task
  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  // Open material modal
  const openMaterialModal = (taskIndex: number, materialIndex?: number) => {
    setCurrentTaskIndex(taskIndex);

    if (materialIndex !== undefined) {
      setEditingMaterialIndex(materialIndex);
      setCurrentMaterial({ ...tasks[taskIndex].materials[materialIndex] });
    } else {
      setEditingMaterialIndex(null);
      setCurrentMaterial({
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        cost: '0.00',
      });
    }

    setShowMaterialModal(true);
  };

  // Handle material input change
  const handleMaterialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'quantity') {
      setCurrentMaterial({
        ...currentMaterial,
        [name]: parseInt(value) || 1,
      });
    } else if (name === 'cost') {
      setCurrentMaterial({
        ...currentMaterial,
        [name]: formatCurrency(value),
      });
    } else {
      setCurrentMaterial({
        ...currentMaterial,
        [name]: value,
      });
    }
  };

  // Save material
  const saveMaterial = () => {
    const newTasks = [...tasks];

    if (editingMaterialIndex !== null) {
      // Edit existing material
      newTasks[currentTaskIndex].materials[editingMaterialIndex] = { ...currentMaterial };
    } else {
      // Add new material
      newTasks[currentTaskIndex].materials.push({ ...currentMaterial });
    }

    setTasks(newTasks);
    setShowMaterialModal(false);
  };

  // Remove material
  const removeMaterial = (taskIndex: number, materialIndex: number) => {
    const newTasks = [...tasks];
    newTasks[taskIndex].materials.splice(materialIndex, 1);
    setTasks(newTasks);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const subtotalTasks = tasks.reduce((sum, task) => sum + parseFloat(task.price), 0);
    const subtotalMaterials = tasks.reduce((sum, task) => {
      if (task.materialType === 'lumpsum') {
        return sum + parseFloat(task.estimatedMaterialsCostLumpSum);
      }
      return sum + task.materials.reduce((materialSum: number, material: { cost: string; quantity: number }) => 
        materialSum + parseFloat(material.cost) * material.quantity, 0);
    }, 0);
    const complexityCharge = parseFloat(formData.complexityCharge) || 0;
    const markupCharge = parseFloat(formData.markupCharge) || 0;
    const grandTotal = subtotalTasks + subtotalMaterials + complexityCharge + markupCharge;

    updateQuoteMutation.mutate({
      id: id as string,
      title: formData.title,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      notes: formData.notes,
      subtotalTasks,
      subtotalMaterials,
      complexityCharge,
      markupCharge,
      grandTotal,
    });
  };

  return (
    <>
      <Head>
        <title>Edit Quote - {quote.title}</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="light"
                startContent={<ArrowLeft size={20} />}
                onClick={() => router.push('/admin/quotes')}
              >
                Back to Quotes
              </Button>
              <h1 className="text-2xl font-semibold">Edit Quote</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
                <div className="space-y-4">
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
                </div>
              </div>

              <Textarea
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="min-h-[100px]"
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Tasks</h2>
                  <Button
                    color="primary"
                    variant="light"
                    startContent={<Plus size={20} />}
                    onClick={addTask}
                  >
                    Add Task
                  </Button>
                </div>

                {tasks.map((task, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Task Description"
                        name="description"
                        value={task.description}
                        onChange={(e) => handleTaskChange(index, e)}
                        required
                      />
                      <Input
                        label="Price"
                        name="price"
                        value={task.price}
                        onChange={(e) => handleTaskChange(index, e)}
                        startContent={<span className="text-default-400">$</span>}
                        required
                      />
                      <div className="md:col-span-2 flex justify-end">
                        <Button
                          color="danger"
                          variant="light"
                          startContent={<Trash size={20} />}
                          onClick={() => removeTask(index)}
                        >
                          Remove Task
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Complexity Charge"
                  name="complexityCharge"
                  value={formData.complexityCharge}
                  onChange={handleInputChange}
                  startContent={<span className="text-default-400">$</span>}
                />
                <Input
                  label="Markup Charge"
                  name="markupCharge"
                  value={formData.markupCharge}
                  onChange={handleInputChange}
                  startContent={<span className="text-default-400">$</span>}
                />
              </div>

              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal (Tasks):</span>
                    <span>${totals.subtotalTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal (Materials):</span>
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
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Grand Total:</span>
                    <span>${totals.grandTotal}</span>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button
                  color="primary"
                  type="submit"
                  startContent={<Save size={20} />}
                  isLoading={updateQuoteMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
