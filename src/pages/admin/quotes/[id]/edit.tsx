import React, { useEffect, useState } from 'react';
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
import { useQuotes } from '~/contexts/QuotesContext';
import { useTranslation } from '~/hooks/useTranslation';

export default function EditQuotePage() {
  const router = useRouter();
  const { id } = router.query;
  const { status } = useSession();
  const { formatCurrency } = useTranslation();
  const [mounted, setMounted] = useState(false);
  
  // Get quote context for state and actions
  const {
    quoteFormData,
    tasks,
    setQuoteFormData,
    addTask,
    updateTask,
    removeTask,
    addMaterial,
    updateMaterial,
    removeMaterial,
    calculateTotals,
    updateQuote,
    fetchQuoteById,
    isSubmitting,
    loading,
    products,
  } = useQuotes();
  
  // Set mounted state on first render
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Fetch quote data when component mounts
  useEffect(() => {
    if (mounted && id && typeof id === 'string' && status === 'authenticated') {
      fetchQuoteById(id);
    }
  }, [mounted, id, status]);
  
  // Handle input changes
  const handleInputChange = (field: keyof typeof quoteFormData, value: string | number) => {
    setQuoteFormData({ [field]: value });
  };
  
  // Handle task changes
  const handleTaskChange = (taskIndex: number, field: string, value: any) => {
    updateTask(taskIndex, { [field]: value });
  };
  
  // Handle material changes
  const handleMaterialChange = (taskIndex: number, materialIndex: number, field: string, value: any) => {
    updateMaterial(taskIndex, materialIndex, { [field]: value });
  };
  
  // Handle material product selection
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
    if (id && typeof id === 'string') {
      const success = await updateQuote(id);
      if (success) {
        router.push(`/admin/quotes/${id}`);
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
              <Button
                isIconOnly
                variant="light"
                onPress={() => router.back()}
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-2xl font-bold">Edit Quote</h1>
            </div>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isSubmitting}
            >
              Update Quote
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quote Details */}
            <Card className="lg:col-span-2 border-none shadow-none">
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
                      inputWrapper: "border-none"
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
                      inputWrapper: "border-none"
                    }}
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
                      radius="none"
                      classNames={{
                        inputWrapper: "border-none"
                      }}
                    />
                    
                    <Input
                      label="Customer Phone"
                      name="customerPhone"
                      value={quoteFormData.customerPhone}
                      onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      aria-label="Customer phone"
                      radius="none"
                      classNames={{
                        inputWrapper: "border-none"
                      }}
                    />
                  </div>
                  
                  <Textarea
                    label="Notes"
                    name="notes"
                    value={quoteFormData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional information..."
                    aria-label="Quote notes"
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />
                </div>
              </CardBody>
            </Card>
            
            {/* Pricing & Adjustments */}
            <Card className="border-none shadow-none">
              <CardHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">Pricing & Adjustments</h2>
              </CardHeader>
              <CardBody className="border-none">
                <div className="space-y-4">
                  <NumberInput
                    label="Complexity Charge"
                    value={quoteFormData.complexityCharge}
                    onValueChange={(value) => handleInputChange('complexityCharge', value)}
                    startContent="$"
                    min={0}
                    step={1}
                    formatOptions={{
                      style: 'decimal',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }}
                    aria-label="Complexity charge"
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />
                  
                  <NumberInput
                    label="Markup Charge"
                    value={quoteFormData.markupCharge}
                    onValueChange={(value) => handleInputChange('markupCharge', value)}
                    startContent="$"
                    min={0}
                    step={1}
                    formatOptions={{
                      style: 'decimal',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }}
                    aria-label="Markup charge"
                    radius="none"
                    classNames={{
                      inputWrapper: "border-none"
                    }}
                  />
                  
                  <Divider className="my-4" />
                  
                  <div className="p-4 bg-background/50 rounded-lg space-y-2">
                    <h3 className="text-lg font-semibold mb-2">Quote Summary</h3>
                    <div className="flex justify-between">
                      <span>Tasks Subtotal:</span>
                      <span>{formatCurrency(totals.subtotalTasks)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Materials Subtotal:</span>
                      <span>{formatCurrency(totals.subtotalMaterials)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Complexity Charge:</span>
                      <span>{formatCurrency(totals.complexityCharge)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Markup Charge:</span>
                      <span>{formatCurrency(totals.markupCharge)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t mt-2">
                      <span>Grand Total:</span>
                      <span>{formatCurrency(totals.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Tasks Section */}
            <Card className="lg:col-span-3 border-none shadow-none">
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tasks</h2>
                <Button
                  color="primary"
                  onPress={addTask}
                  startContent={<Plus size={16} />}
                >
                  Add Task
                </Button>
              </CardHeader>
              <CardBody className="border-none">
                {tasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No tasks added yet. Click "Add Task" to start building your quote.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {tasks.map((task, taskIndex) => (
                      <div key={taskIndex} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-4 flex-1">
                            <Input
                              label="Task Name"
                              value={task.name}
                              onChange={(e) => handleTaskChange(taskIndex, 'name', e.target.value)}
                              required
                              radius="none"
                              classNames={{
                                inputWrapper: "border-none"
                              }}
                            />
                            <Textarea
                              label="Description"
                              value={task.description ?? ''}
                              onChange={(e) => handleTaskChange(taskIndex, 'description', e.target.value)}
                              radius="none"
                              classNames={{
                                inputWrapper: "border-none"
                              }}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <NumberInput
                                label="Price"
                                value={parseFloat(task.price) || 0}
                                onValueChange={(value) => handleTaskChange(taskIndex, 'price', String(value))}
                                startContent="$"
                                min={0}
                                step={0.01}
                                formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                                aria-label={`Price for task ${task.name}`}
                                radius="none"
                                classNames={{
                                  inputWrapper: "border-none"
                                }}
                              />
                              <NumberInput
                                label="Quantity"
                                value={task.quantity}
                                onValueChange={(value) => handleTaskChange(taskIndex, 'quantity', value)}
                                min={1}
                                step={1}
                                aria-label={`Quantity for task ${task.name}`}
                                radius="none"
                                classNames={{
                                  inputWrapper: "border-none"
                                }}
                              />
                            </div>
                            
                            <div className="pt-2">
                              <Select
                                label="Material Cost Type"
                                selectedKeys={[task.materialType]}
                                onChange={(e) => handleTaskChange(taskIndex, 'materialType', e.target.value)}
                                aria-label="Select material cost type"
                                radius="none"
                                classNames={{
                                  trigger: "border-none"
                                }}
                              >
                                <SelectItem key="lumpsum">Lump Sum</SelectItem>
                                <SelectItem key="itemized">Itemized</SelectItem>
                              </Select>
                            </div>
                            
                            {task.materialType === 'lumpsum' ? (
                              <NumberInput
                                label="Estimated Materials Cost"
                                value={task.estimatedMaterialsCostLumpSum}
                                onValueChange={(value) => handleTaskChange(taskIndex, 'estimatedMaterialsCostLumpSum', value)}
                                startContent="$"
                                min={0}
                                step={0.01}
                                formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                                aria-label={`Estimated materials cost for task ${task.name}`}
                                radius="none"
                                classNames={{
                                  inputWrapper: "border-none"
                                }}
                              />
                            ) : (
                              <div className="space-y-4 pt-2">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-md font-semibold">Materials</h4>
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    onPress={() => addMaterial(taskIndex)}
                                    startContent={<Plus size={14} />}
                                  >
                                    Add Material
                                  </Button>
                                </div>
                                
                                {task.materials.length === 0 ? (
                                  <div className="text-center py-4 text-muted-foreground text-sm">
                                    No materials added yet
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {task.materials.map((material, materialIndex) => (
                                      <div key={materialIndex} className="border rounded p-3 space-y-3">
                                        <div className="flex justify-between">
                                          <h5 className="text-sm font-medium">Material #{materialIndex + 1}</h5>
                                          <Button
                                            size="sm"
                                            isIconOnly
                                            variant="light"
                                            onPress={() => removeMaterial(taskIndex, materialIndex)}
                                            color="danger"
                                          >
                                            <Trash2 size={14} />
                                          </Button>
                                        </div>
                                        
                                        <Select
                                          label="Product"
                                          selectedKeys={[material.productId]}
                                          onChange={(e) => handleMaterialProductChange(taskIndex, materialIndex, e.target.value)}
                                          aria-label="Select product"
                                          radius="none"
                                          classNames={{
                                            trigger: "border-none"
                                          }}
                                        >
                                          {products.map((product) => (
                                            <SelectItem key={product.id} textValue={product.name}>{product.name}</SelectItem>
                                          ))}
                                        </Select>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                          <NumberInput
                                            label="Unit Price"
                                            value={parseFloat(String(material.unitPrice)) || 0}
                                            onValueChange={(value) => handleMaterialChange(taskIndex, materialIndex, 'unitPrice', value)}
                                            startContent="$"
                                            min={0}
                                            step={0.01}
                                            size="sm"
                                            formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                                            radius="none"
                                            classNames={{
                                              inputWrapper: "border-none"
                                            }}
                                          />
                                          <NumberInput
                                            label="Quantity"
                                            value={material.quantity}
                                            onValueChange={(value) => handleMaterialChange(taskIndex, materialIndex, 'quantity', value)}
                                            min={1}
                                            step={1}
                                            size="sm"
                                            radius="none"
                                            classNames={{
                                              inputWrapper: "border-none"
                                            }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <Button
                            isIconOnly
                            variant="light"
                            color="danger"
                            onPress={() => removeTask(taskIndex)}
                            className="ml-2"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
          
          <div className="flex justify-between mt-6">
            <Button
              variant="flat"
              onPress={() => router.push('/admin/quotes')}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isSubmitting}
            >
              Update Quote
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
