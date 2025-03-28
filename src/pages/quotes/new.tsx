import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Plus, X, Save } from 'lucide-react';
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
} from '@heroui/react';
import { toast } from 'sonner';

export default function NewQuotePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

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
  const [tasks, setTasks] = useState([
    {
      id: '1',
      description: '',
      price: '0.00',
      materialType: 'lumpsum', // or 'itemized'
      estimatedMaterialsCostLumpSum: '0.00',
      materials: [] as { id: string; description: string; quantity: number; cost: string }[],
    },
  ]);

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

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
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
        task.materials.forEach((material) => {
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
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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
    const task = newTasks[index];

    if (!task) return;

    if (name === 'price' || name === 'estimatedMaterialsCostLumpSum') {
      newTasks[index] = {
        ...task,
        [name]: formatCurrency(value),
      };
    } else if (name === 'materialType') {
      newTasks[index] = {
        ...task,
        [name]: value,
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
    const taskMaterials = [...(newTasks[currentTaskIndex]?.materials || [])];

    if (editingMaterialIndex !== null) {
      // Update existing material
      taskMaterials[editingMaterialIndex] = currentMaterial;
    } else {
      // Add new material
      taskMaterials.push(currentMaterial);
    }

    if (newTasks[currentTaskIndex]) {
      newTasks[currentTaskIndex].materials = taskMaterials;
      setTasks(newTasks);
    }

    setShowMaterialModal(false);
  };

  // Remove material
  const removeMaterial = (taskIndex: number, materialIndex: number) => {
    const newTasks = [...tasks];
    const taskMaterials = [...(newTasks[taskIndex]?.materials || [])];
    taskMaterials.splice(materialIndex, 1);

    if (newTasks[taskIndex]) {
      newTasks[taskIndex].materials = taskMaterials;
      setTasks(newTasks);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // In a real app, this would call a tRPC mutation to save the quote
    console.log('Submitting form with data:', { ...formData, tasks, ...totals });
    toast.success('Quote saved successfully!');

    // Navigate back to quotes list
    router.push('/quotes');
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs className="mb-5">
        <BreadcrumbItem href="/quotes">Quotes</BreadcrumbItem>
        <BreadcrumbItem>New Quote</BreadcrumbItem>
      </Breadcrumbs>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Create New Quote</h1>
        <Button
          color="default"
          startContent={<ArrowLeft size={16} />}
          onPress={() => router.push('/quotes')}
          className="mt-2 sm:mt-0"
        >
          Back to Quotes
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Quote Information */}
        <Card className="bg-content1 shadow-sm">
          <CardHeader className="pb-0">
            <h2 className="text-lg font-medium">Quote Information</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4">
              <Input
                type="text"
                id="title"
                name="title"
                label="Quote Title"
                labelPlacement="outside"
                value={formData.title}
                onChange={handleInputChange}
                isRequired
                placeholder="Kitchen Remodel, Bathroom Renovation, etc."
              />
            </div>
          </CardBody>
        </Card>

        {/* Customer Information */}
        <Card className="bg-content1 shadow-sm">
          <CardHeader className="pb-0">
            <h2 className="text-lg font-medium">Customer Information</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="text"
                id="customerName"
                name="customerName"
                label="Name"
                value={formData.customerName}
                onChange={handleInputChange}
                isRequired
                placeholder="John Smith"
              />
              <Input
                type="email"
                id="customerEmail"
                name="customerEmail"
                label="Email"
                value={formData.customerEmail}
                onChange={handleInputChange}
                placeholder="john@example.com"
              />
              <Input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                label="Phone"
                value={formData.customerPhone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
              />
            </div>
          </CardBody>
        </Card>

        {/* Tasks and Materials */}
        <Card className="bg-content1 shadow-sm">
          <CardHeader className="flex justify-between items-center pb-0">
            <h2 className="text-lg font-medium">Tasks and Materials</h2>
            <Button color="primary" startContent={<Plus size={18} />} onPress={addTask}>
              Add Task
            </Button>
          </CardHeader>
          <CardBody className="space-y-6">
            {tasks.map((task, taskIndex) => (
              <Card
                key={task.id}
                className="border border-default-200 dark:border-default-700 shadow-none"
              >
                <CardHeader className="flex justify-between items-center bg-default-50 dark:bg-default-100/10 py-2">
                  <h3 className="text-base font-medium">Task {taskIndex + 1}</h3>
                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    onPress={() => removeTask(taskIndex)}
                    aria-label="Remove task"
                  >
                    <X size={16} />
                  </Button>
                </CardHeader>
                <CardBody className="space-y-4">
                  {/* Task Description */}
                  <Input
                    type="text"
                    id={`task-${taskIndex}-description`}
                    name="description"
                    label="Description"
                    value={task.description}
                    onChange={(e) => handleTaskChange(taskIndex, e)}
                    isRequired
                    placeholder="What work needs to be done?"
                    classNames={{
                      inputWrapper: 'bg-transparent',
                    }}
                  />

                  {/* Task Price */}
                  <Input
                    type="text"
                    id={`task-${taskIndex}-price`}
                    name="price"
                    label="Task Price (Labor/Skill)"
                    value={task.price}
                    onChange={(e) => handleTaskChange(taskIndex, e)}
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">$</span>
                      </div>
                    }
                    isRequired
                    classNames={{
                      inputWrapper: 'bg-transparent',
                    }}
                  />

                  {/* Materials Type */}
                  <Select
                    id={`task-${taskIndex}-materialType`}
                    name="materialType"
                    label="Materials Cost Type"
                    value={task.materialType}
                    onChange={(e) => handleTaskChange(taskIndex, e)}
                    classNames={{
                      trigger: 'bg-transparent',
                    }}
                  >
                    <SelectItem key="lumpsum" textValue="lumpsum">
                      Lump Sum
                    </SelectItem>
                    <SelectItem key="itemized" textValue="itemized">
                      Itemized
                    </SelectItem>
                  </Select>

                  {/* Materials Cost */}
                  {task.materialType === 'lumpsum' ? (
                    <Input
                      type="text"
                      id={`task-${taskIndex}-estimatedMaterialsCostLumpSum`}
                      name="estimatedMaterialsCostLumpSum"
                      label="Estimated Materials Cost (Lump Sum)"
                      value={task.estimatedMaterialsCostLumpSum}
                      onChange={(e) => handleTaskChange(taskIndex, e)}
                      startContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-default-400 text-small">$</span>
                        </div>
                      }
                      classNames={{
                        inputWrapper: 'bg-transparent',
                      }}
                    />
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">Materials</h4>
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          onPress={() => openMaterialModal(taskIndex)}
                          startContent={<Plus size={16} />}
                        >
                          Add Material
                        </Button>
                      </div>

                      {task.materials.length === 0 ? (
                        <div className="text-center p-4 border border-dashed border-default-300 dark:border-default-600 rounded-md">
                          <p className="text-default-500 text-sm">No materials added yet</p>
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="mt-2"
                            onPress={() => openMaterialModal(taskIndex)}
                            startContent={<Plus size={16} />}
                          >
                            Add Material
                          </Button>
                        </div>
                      ) : (
                        <div className="border border-default-200 dark:border-default-700 rounded-md overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-default-50 dark:bg-default-100/10">
                              <tr>
                                <th className="py-2 px-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider">
                                  Description
                                </th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider">
                                  Qty
                                </th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider">
                                  Unit Cost
                                </th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider">
                                  Total
                                </th>
                                <th className="py-2 px-3 text-right text-xs font-medium text-default-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-default-200 dark:divide-default-700">
                              {task.materials.map((material, materialIndex) => (
                                <tr key={material.id}>
                                  <td className="py-2 px-3 text-sm">{material.description}</td>
                                  <td className="py-2 px-3 text-sm">{material.quantity}</td>
                                  <td className="py-2 px-3 text-sm">${material.cost}</td>
                                  <td className="py-2 px-3 text-sm">
                                    ${(parseFloat(material.cost) * material.quantity).toFixed(2)}
                                  </td>
                                  <td className="py-2 px-3 text-right space-x-1">
                                    <Button
                                      size="sm"
                                      isIconOnly
                                      onPress={() => openMaterialModal(taskIndex, materialIndex)}
                                      aria-label="Edit material"
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      isIconOnly
                                      color="danger"
                                      onPress={() => removeMaterial(taskIndex, materialIndex)}
                                      aria-label="Remove material"
                                    >
                                      <X size={16} />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </CardBody>
        </Card>

        {/* Notes */}
        <Card className="bg-content1 shadow-sm">
          <CardHeader className="pb-0">
            <h2 className="text-lg font-medium">Notes</h2>
          </CardHeader>
          <CardBody>
            <Textarea
              id="notes"
              name="notes"
              label="Add any notes or special instructions here..."
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="bg-transparent"
            />
          </CardBody>
        </Card>

        {/* Quote Adjustments & Totals */}
        <Card className="bg-content1 shadow-sm">
          <CardHeader className="pb-0">
            <h2 className="text-lg font-medium">Quote Adjustments & Totals</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  type="text"
                  id="complexityCharge"
                  name="complexityCharge"
                  label="Complexity/Contingency Charge"
                  value={formData.complexityCharge}
                  onChange={handleInputChange}
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">$</span>
                    </div>
                  }
                  classNames={{
                    inputWrapper: 'bg-transparent',
                  }}
                />
              </div>
              <div>
                <Input
                  type="text"
                  id="markupCharge"
                  name="markupCharge"
                  label="Markup/Profit Charge"
                  value={formData.markupCharge}
                  onChange={handleInputChange}
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">$</span>
                    </div>
                  }
                  classNames={{
                    inputWrapper: 'bg-transparent',
                  }}
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-default-50 dark:bg-default-100/10 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-default-500">Subtotal (Tasks)</span>
                  <span className="text-sm font-medium">${totals.subtotalTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-default-500">Subtotal (Materials)</span>
                  <span className="text-sm font-medium">${totals.subtotalMaterials}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-default-500">Complexity/Contingency Charge</span>
                  <span className="text-sm font-medium">${totals.complexityCharge}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-default-500">Markup/Profit Charge</span>
                  <span className="text-sm font-medium">${totals.markupCharge}</span>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between">
                  <span className="text-base font-medium">Grand Total</span>
                  <span className="text-base font-bold">${totals.grandTotal}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="flat" onPress={() => router.push('/quotes')}>
            Cancel
          </Button>
          <Button type="submit" color="primary" startContent={<Save size={18} />}>
            Save Quote
          </Button>
        </div>
      </form>

      {/* Material Modal */}
      <Modal
        isOpen={showMaterialModal}
        onClose={() => setShowMaterialModal(false)}
        placement="center"
        classNames={{
          body: 'py-6',
          base: 'bg-content1',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editingMaterialIndex !== null ? 'Edit Material' : 'Add Material'}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    type="text"
                    id="material-description"
                    name="description"
                    label="Description"
                    value={currentMaterial.description}
                    onChange={handleMaterialChange}
                    isRequired
                    classNames={{
                      inputWrapper: 'bg-transparent',
                    }}
                  />
                  <Input
                    type="number"
                    min="1"
                    id="material-quantity"
                    name="quantity"
                    label="Quantity"
                    value={currentMaterial.quantity.toString()}
                    onChange={handleMaterialChange}
                    isRequired
                    classNames={{
                      inputWrapper: 'bg-transparent',
                    }}
                  />
                  <Input
                    type="text"
                    id="material-cost"
                    name="cost"
                    label="Unit Cost"
                    value={currentMaterial.cost}
                    onChange={handleMaterialChange}
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">$</span>
                      </div>
                    }
                    isRequired
                    classNames={{
                      inputWrapper: 'bg-transparent',
                    }}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    saveMaterial();
                    onClose();
                  }}
                >
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
