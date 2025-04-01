'use client';

import React, { useState, useEffect, useCallback, useId, useRef, useReducer } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Textarea,
  NumberInput,
  Spinner,
  Select,
  SelectItem,
  RadioGroup,
  Radio,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Divider,
} from '@heroui/react';
import { Save, Plus, Edit, Trash2, Box, Banknote } from 'lucide-react';
import { api } from '~/utils/api';
import { useToastStore } from '~/store';
import { useTranslation } from '~/hooks/useTranslation';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';
import { type QuoteStatusType, type tasks, type materials } from '~/server/db/schema';

type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;
type QuoteByIdRoute = RouterOutput['quote']['getById'];
type QuoteStatus = QuoteByIdRoute['status'];
// Backend update input type
type BackendUpdateInput = RouterInput['quote']['update'];

// Define Task/Material types based on schema or a more stable source first
type MaterialFormData = {
  id?: string;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  productId?: string | null;
  notes?: string | null;
  // Removed taskId to avoid circular dependency if TaskFormData needs MaterialFormData
};

type TaskFormData = {
  id?: string;
  description: string;
  price: number;
  materialType: 'lumpsum' | 'itemized';
  estimatedMaterialsCostLumpSum?: number | null; // Keep frontend name for state
  materials?: MaterialFormData[];
};

// Frontend local state type (more comprehensive than backend input)
type EditQuoteState = {
  id: string;
  title: string; // Use title instead of name
  customerId?: string;
  notes?: string | null;
  status?: QuoteStatusType;
  markupPercentage?: number;
  tasks: TaskFormData[];
  subtotalTasks?: number;
  subtotalMaterials?: number;
  complexityCharge?: number;
  markupCharge?: number;
  grandTotal?: number;
  // Add any other fields managed by the reducer if missing
  date?: string;
  expiryDate?: string;
  poNumber?: string;
};

// Update FormAction type to fix the material property issue
type FormAction =
  // Use EditQuoteState for UPDATE_FIELD
  | { type: 'UPDATE_FIELD'; field: keyof EditQuoteState; value: any }
  | { type: 'ADD_TASK' }
  | { type: 'REMOVE_TASK'; index: number }
  | { type: 'UPDATE_TASK'; index: number; field: keyof TaskFormData; value: any }
  | { type: 'ADD_MATERIAL'; taskIndex: number }
  | { type: 'REMOVE_MATERIAL'; taskIndex: number; materialIndex: number }
  | {
      type: 'UPDATE_MATERIAL';
      taskIndex: number;
      materialIndex: number;
      field: keyof MaterialFormData;
      value: any;
    }
  | {
      type: 'UPDATE_TOTALS';
      payload: {
        subtotalTasks: number;
        subtotalMaterials: number;
        complexityCharge: number;
        markupCharge: number;
        grandTotal: number;
      };
    }
  | { type: 'SET_INITIAL_DATA'; data: EditQuoteState };

// Define the form reducer outside the component
// Use EditQuoteState for state type
const formReducer = (state: EditQuoteState, action: FormAction): EditQuoteState => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.field]: action.value,
      };
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [
          ...state.tasks,
          {
            id: crypto.randomUUID(),
            description: '',
            price: 0,
            materialType: 'itemized',
            estimatedMaterialsCostLumpSum: 0,
            materials: [],
          },
        ],
      };
    case 'REMOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((_: TaskFormData, index: number) => index !== action.index),
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task: TaskFormData, index: number) =>
          index === action.index
            ? {
                ...task,
                [action.field]: action.value,
                description: action.field === 'description' ? action.value : task.description,
              }
            : task
        ),
      };
    case 'ADD_MATERIAL':
      return {
        ...state,
        tasks: state.tasks.map((task: TaskFormData, index: number) =>
          index === action.taskIndex
            ? {
                ...task,
                materials: [
                  ...(task.materials || []),
                  {
                    id: crypto.randomUUID(),
                    name: '',
                    description: null,
                    quantity: 1,
                    unitPrice: 0,
                    productId: null,
                    notes: null,
                  },
                ],
              }
            : task
        ),
      };
    case 'REMOVE_MATERIAL':
      return {
        ...state,
        tasks: state.tasks.map((task: TaskFormData, index: number) =>
          index === action.taskIndex
            ? {
                ...task,
                materials: task.materials?.filter(
                  (_: MaterialFormData, materialIndex: number) => materialIndex !== action.materialIndex
                ),
              }
            : task
        ),
      };
    case 'UPDATE_MATERIAL':
      return {
        ...state,
        tasks: state.tasks.map((task: TaskFormData, index: number) =>
          index === action.taskIndex
            ? {
                ...task,
                materials: task.materials?.map((material: MaterialFormData, materialIndex: number) =>
                  materialIndex === action.materialIndex
                    ? {
                        ...material,
                        [action.field]: action.value,
                        description:
                          action.field === 'description' ? action.value : material.description,
                      }
                    : material
                ),
              }
            : task
        ),
      };
    case 'UPDATE_TOTALS':
      return {
        ...state,
        ...action.payload,
      };
    case 'SET_INITIAL_DATA':
      return action.data;
    default:
      return state;
  }
};

const EditQuotePage = () => {
  const router = useRouter();
  const { id: quoteId } = router.query;
  const { data: session, status: sessionStatus } = useSession();
  const toast = useToastStore();
  const { formatCurrency } = useTranslation();

  // Generate stable IDs for components
  const buttonId = useId();

  // Component state
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);

  // Use refs instead of state for values that don't need to trigger re-renders
  const currentTaskIndexRef = useRef<number | null>(null);
  const currentMaterialIndexRef = useRef<number | null>(null);
  const materialDataRef = useRef<{
    name?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    productId?: string | null;
    notes?: string;
  }>({});

  // Create a forceUpdate mechanism to ensure UI updates when refs change
  const [, updateState] = useState({});
  const forceUpdate = useCallback(() => updateState({}), []);

  // Initial form data - Use EditQuoteState type and 'title'
  const initialFormData: EditQuoteState = {
    id: '',
    customerId: '',
    title: '', // Use title
    date: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    poNumber: '',
    notes: '',
    status: 'DRAFT',
    tasks: [],
    subtotalTasks: 0,
    subtotalMaterials: 0,
    complexityCharge: 0,
    markupCharge: 0,
    grandTotal: 0,
  };

  // Replace useState with useReducer - Use EditQuoteState
  const [formData, dispatch] = useReducer(formReducer, initialFormData);

  // Get products for material selection
  const { data: productsData, isLoading: isProductLoading } = api.product.getAll.useQuery(
    { limit: 100 },
    { enabled: !!session && mounted }
  );

  // Fetch quote data with proper type handling
  const { data: quoteData, isLoading: isLoadingQuote } = api.quote.getById.useQuery(
    { id: typeof quoteId === 'string' ? quoteId : '' },
    { enabled: typeof quoteId === 'string' && sessionStatus === 'authenticated' }
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Add calculateTotals and getMaterialsTotal functions
  const getMaterialsTotal = useCallback((task: TaskFormData) => {
    if (task.materialType === 'lumpsum') {
      return task.estimatedMaterialsCostLumpSum || 0;
    }
    return (
      task.materials?.reduce(
        (sum: number, material: MaterialFormData) =>
          sum + (material.unitPrice || 0) * (material.quantity || 0),
        0
      ) || 0
    );
  }, []);

  const calculateTotals = useCallback(() => {
    const subtotalTasks = formData.tasks.reduce((sum: number, task: TaskFormData) => {
      const taskTotal = (task.price || 0);
      return sum + taskTotal;
    }, 0);

    const subtotalMaterials = formData.tasks.reduce((sum: number, task: TaskFormData) => {
      const materialsTotal = getMaterialsTotal(task);
      return sum + materialsTotal;
    }, 0);

    const complexityCharge = formData.complexityCharge || 0;
    const markupCharge = formData.markupCharge || 0;

    const grandTotal = subtotalTasks + subtotalMaterials + complexityCharge + markupCharge;

    return {
      subtotalTasks,
      subtotalMaterials,
      complexityCharge,
      markupCharge,
      grandTotal,
    };
  }, [formData.tasks, formData.complexityCharge, formData.markupCharge, getMaterialsTotal]);

  // Set initial form data when quote data is loaded
  useEffect(() => {
    // Ensure quoteData exists and has the expected structure (basic check)
    if (quoteData && typeof quoteData === 'object' && quoteData.id) {
      // Explicitly map fetched data (QuoteGetData) to EditQuoteState
      const initialState: EditQuoteState = {
        id: quoteData.id,
        title: quoteData.title || '',
        customerId: quoteData.customerId || undefined,
        notes: quoteData.notes ?? null, // Use nullish coalescing for null
        status: quoteData.status, // Type should match QuoteStatusType
        markupPercentage: Number(quoteData.markupPercentage || 0),
        // No complexityPercentage
        tasks: (quoteData.tasks || []).map((task: QuoteByIdRoute['tasks'][number]): TaskFormData => ({
          id: task.id,
          description: task.description || '',
          price: Number(task.price || 0),
          materialType: (task.materialType as 'lumpsum' | 'itemized') ?? 'itemized',
          estimatedMaterialsCostLumpSum: Number(task.estimatedMaterialsCost || 0),
          // Use subtypes from QuoteGetData if possible
          materials: (task.materials || []).map((material: NonNullable<QuoteByIdRoute['tasks'][number]['materials']>[number]): MaterialFormData => ({
            id: material.id,
            name: material.name || '',
            description: material.description ?? null,
            unitPrice: Number(material.unitPrice || 0),
            quantity: Number(material.quantity || 1),
            productId: material.productId ?? null,
            notes: material.notes ?? null,
          })),
        })),
        // Initialize calculated fields to 0, they should be recalculated
        subtotalTasks: 0,
        subtotalMaterials: 0,
        complexityCharge: 0,
        markupCharge: 0,
        grandTotal: 0,
        // Initialize other fields if needed, e.g., from quoteData if they exist
        // date: quoteData.createdAt ? formatDate(quoteData.createdAt) : undefined, // Example
      };
      dispatch({ type: 'SET_INITIAL_DATA', data: initialState });
    } else if (quoteData === null) {
      // Handle case where quote is explicitly not found (if API returns null)
      toast.error("Quote not found.");
      // Optionally redirect
      // router.push('/admin/quotes');
    }
    // Add dependencies: quoteData, toast, router (if redirecting)
  }, [quoteData, toast]); // Removed router from deps unless needed for redirect

  // Update quote mutation with proper invalidation
  const updateQuoteMutation = api.quote.update.useMutation({
    onSuccess: () => {
      toast.success('Quote updated successfully');
      // Invalidate relevant queries
      if (quoteId) {
        utils.quote.getById.invalidate({ id: quoteId as string });
      }
      utils.quote.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Set mounted state on initial render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Replace multiple handlers with consolidated form actions
  const handleFormChange = (field: keyof EditQuoteState, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  const handleTaskChange = (index: number, field: string, value: any) => {
    dispatch({ type: 'UPDATE_TASK', index, field: field as keyof TaskFormData, value });
  };

  const handleAddTask = () => {
    dispatch({ type: 'ADD_TASK' });
  };

  const handleRemoveTask = (index: number) => {
    dispatch({ type: 'REMOVE_TASK', index });
  };

  const handleAddMaterial = (taskIndex: number) => {
    currentTaskIndexRef.current = taskIndex;
    currentMaterialIndexRef.current = null;
    materialDataRef.current = {
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      productId: null,
      notes: '',
    };
    setMaterialModalOpen(true);
  };

  const handleEditMaterial = (taskIndex: number, materialIndex: number) => {
    const task = formData.tasks[taskIndex];
    if (!task?.materials) return;

    const material = task.materials[materialIndex];
    if (material) {
      currentTaskIndexRef.current = taskIndex;
      currentMaterialIndexRef.current = materialIndex;
      materialDataRef.current = {
        name: material.name,
        description: material.description ?? undefined,
        quantity: material.quantity,
        unitPrice: material.unitPrice,
        productId: material.productId,
        notes: material.notes ?? undefined,
      };
      setMaterialModalOpen(true);
    }
  };

  const handleSaveMaterial = () => {
    const materialData = materialDataRef.current;
    if (!materialData.name || !materialData.quantity || materialData.quantity <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const taskIndex = currentTaskIndexRef.current;
    if (taskIndex === null) return;

    const newMaterial: MaterialFormData = {
      id:
        currentMaterialIndexRef.current !== null
          ? formData.tasks[taskIndex]?.materials && formData.tasks[taskIndex]?.materials[currentMaterialIndexRef.current]?.id || ''
          : '',
      name: materialData.name,
      description: materialData.description || '',
      quantity: materialData.quantity,
      unitPrice: materialData.unitPrice || 0,
      productId: materialData.productId,
      notes: materialData.notes || '',
    };

    if (currentMaterialIndexRef.current !== null) {
      dispatch({
        type: 'UPDATE_MATERIAL',
        taskIndex,
        materialIndex: currentMaterialIndexRef.current,
        field: 'name',
        value: newMaterial.name,
      });
      dispatch({
        type: 'UPDATE_MATERIAL',
        taskIndex,
        materialIndex: currentMaterialIndexRef.current,
        field: 'description',
        value: newMaterial.description,
      });
      dispatch({
        type: 'UPDATE_MATERIAL',
        taskIndex,
        materialIndex: currentMaterialIndexRef.current,
        field: 'quantity',
        value: newMaterial.quantity,
      });
      dispatch({
        type: 'UPDATE_MATERIAL',
        taskIndex,
        materialIndex: currentMaterialIndexRef.current,
        field: 'unitPrice',
        value: newMaterial.unitPrice,
      });
      dispatch({
        type: 'UPDATE_MATERIAL',
        taskIndex,
        materialIndex: currentMaterialIndexRef.current,
        field: 'productId',
        value: newMaterial.productId,
      });
      dispatch({
        type: 'UPDATE_MATERIAL',
        taskIndex,
        materialIndex: currentMaterialIndexRef.current,
        field: 'notes',
        value: newMaterial.notes,
      });
    } else {
      dispatch({ type: 'ADD_MATERIAL', taskIndex });
    }

    setMaterialModalOpen(false);
    currentTaskIndexRef.current = null;
    currentMaterialIndexRef.current = null;
  };

  // Handle save quote button
  const handleSave = (status?: 'draft' | 'sent') => {
    // Construct payload with only fields accepted by the current backend update procedure
    const apiData: RouterInput['quote']['update'] = {
      id: typeof quoteId === 'string' ? quoteId : '',
      // Use 'title' as expected by backend, not 'name' from formData
      title: formData.title,
      // Only include fields defined in the router input schema
      notes: formData.notes || null,
      status: (status || formData.status || 'DRAFT').toUpperCase() as QuoteStatusType,
      markupPercentage: formData.markupPercentage,
      // DO NOT send tasks, subtotals, complexity, grandTotal etc.
    };

    // Ensure required ID is present
    if (!apiData.id) {
        toast.error('Quote ID is missing. Cannot save.');
        return;
    }

    // Clear the 'as any' cast if possible by ensuring type match
    updateQuoteMutation.mutate(apiData);
  };

  // Calculate task total (labor + materials)
  const getTaskTotal = (task: TaskFormData) => {
    const laborTotal = Number(task.price || 0);
    const materialsTotal = getMaterialsTotal(task);
    return laborTotal + materialsTotal;
  };

  // Customer information input

  // Title input - Rename handler and update field
  const handleTitleChange = (value: string) => {
    handleFormChange('title', value);
  };

  // Add back material handlers
  const handleMaterialChange = (field: keyof MaterialFormData, value: string | number | null) => {
    materialDataRef.current = {
      ...materialDataRef.current,
      [field]: value,
    };
    forceUpdate();
  };

  const handleProductSelect = (productId: string | null) => {
    if (!productId) {
      materialDataRef.current = {
        ...materialDataRef.current,
        productId: null,
      };
      forceUpdate();
      return;
    }

    const selectedProduct = productsData?.items.find((p) => p.id === productId);
    if (selectedProduct) {
      materialDataRef.current = {
        ...materialDataRef.current,
        productId: selectedProduct.id,
        name: selectedProduct.name,
        description: selectedProduct.description || '',
        unitPrice:
          typeof selectedProduct.unitPrice === 'string'
            ? Number(selectedProduct.unitPrice)
            : selectedProduct.unitPrice || 0,
      };
      forceUpdate();
    }
  };

  const handleRemoveMaterial = (taskIndex: number, materialIndex: number) => {
    dispatch({ type: 'REMOVE_MATERIAL', taskIndex, materialIndex });
  };

  if (sessionStatus === 'loading' || !mounted || isLoadingQuote || isProductLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  // Fix the return statement to preserve the form and modal
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Head>
        <title>Edit Quote | QuoteStudio</title>
      </Head>
      {/* Early return while loading or not authenticated */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Quote</h1>
        <div className="flex space-x-2">
          <Button color="primary" disabled={isSubmitting} onClick={() => handleSave()}>
            {isSubmitting ? <Spinner size="sm" /> : 'Save Changes'}
          </Button>
          <Button variant="flat" onClick={() => router.push(`/admin/quotes/${quoteId}`)}>
            Cancel
          </Button>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Quote Information */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-semibold">Quote Information</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Quote Name"
                placeholder="Enter a name for this quote"
                value={formData.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="mb-2"
              />
              <Textarea
                label="Notes (Optional)"
                placeholder="Enter any additional notes about this quote"
                value={formData.notes || ''}
                onValueChange={(value) => handleFormChange('notes', value)}
              />
            </CardBody>
          </Card>

          {/* Customer Information */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-semibold">Customer Information</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {quoteData?.customer ? (
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="text-lg font-medium">{quoteData.customer.name}</h3>
                  {quoteData.customer.email && (
                    <p className="mt-1 text-sm">
                      <span className="font-medium">Email:</span> {quoteData.customer.email}
                    </p>
                  )}
                  {quoteData.customer.phone && (
                    <p className="mt-1 text-sm">
                      <span className="font-medium">Phone:</span> {quoteData.customer.phone}
                    </p>
                  )}
                  {quoteData.customer.address && (
                    <p className="mt-1 text-sm">
                      <span className="font-medium">Address:</span> {quoteData.customer.address}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-gray-500">
                    To update customer information, please use the Customers section.
                  </p>
                </div>
              ) : (
                <div className="text-danger">No customer associated with this quote</div>
              )}
            </CardBody>
          </Card>

          {/* Tasks */}
          <Card className="mb-6">
            <CardHeader className="flex justify-between">
              <h2 className="text-xl font-semibold">Tasks & Materials</h2>
              <Button
                color="primary"
                variant="flat"
                startContent={<Plus size={16} />}
                onPress={handleAddTask}
                size="sm"
              >
                Add Task
              </Button>
            </CardHeader>
            <CardBody className="space-y-6">
              {!formData.tasks || formData.tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    No tasks added yet. Add a task to get started.
                  </p>
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<Plus size={16} />}
                    onPress={handleAddTask}
                  >
                    Add Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.tasks.map((task, taskIndex) => (
                    <Card key={task.id || `task-${taskIndex}`} className="overflow-visible">
                      <CardHeader className="flex items-center justify-between p-4">
                        <div className="flex-1">
                          <h3 className="text-base font-medium">
                            {task.description ? task.description : `Task ${taskIndex + 1}`}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Total:{' '}
                            <span className="font-semibold">
                              {formatCurrency(getTaskTotal(task as TaskFormData))}
                            </span>
                          </p>
                        </div>
                        <Button
                          isIconOnly
                          color="danger"
                          variant="light"
                          size="sm"
                          onPress={() => handleRemoveTask(taskIndex)}
                          aria-label="Remove task"
                          id={`${buttonId}-remove-task-${taskIndex}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </CardHeader>
                      <CardBody className="border-t px-4 pt-4">
                        <div className="space-y-4">
                          <Textarea
                            label="Task Description"
                            placeholder="Describe the work to be done"
                            value={task.description || ''}
                            onValueChange={(value) =>
                              handleTaskChange(taskIndex, 'description', value)
                            }
                            isRequired
                          />

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <NumberInput
                              label="Labor Cost"
                              placeholder="0.00"
                              value={task.price ? Number(task.price) : 0}
                              onValueChange={(value) => handleTaskChange(taskIndex, 'price', value)}
                              startContent={
                                <Banknote size={16} className="text-muted-foreground" />
                              }
                              step={0.01}
                              min={0}
                              formatOptions={{
                                style: 'decimal',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }}
                            />
                          </div>

                          <div className="mb-2 border-t pt-4">
                            <div className="mb-2">
                              <h4 className="mb-2 font-medium">Materials Calculation</h4>
                              <RadioGroup
                                value={task.materialType}
                                onValueChange={(value) =>
                                  handleTaskChange(
                                    taskIndex,
                                    'materialType',
                                    value as 'lumpsum' | 'itemized'
                                  )
                                }
                                orientation="horizontal"
                              >
                                <Radio value="lumpsum">Lump Sum</Radio>
                                <Radio value="itemized">Itemized</Radio>
                              </RadioGroup>
                            </div>

                            {task.materialType === 'lumpsum' ? (
                              <div className="mt-4">
                                <NumberInput
                                  label="Estimated Materials Cost"
                                  placeholder="0.00"
                                  value={task.estimatedMaterialsCostLumpSum || 0}
                                  onValueChange={(value) =>
                                    handleTaskChange(
                                      taskIndex,
                                      'estimatedMaterialsCostLumpSum',
                                      value
                                    )
                                  }
                                  startContent={<Box size={16} className="text-muted-foreground" />}
                                  step={0.01}
                                  min={0}
                                  formatOptions={{
                                    style: 'decimal',
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="mt-4">
                                <div className="mb-2 flex items-center justify-between">
                                  <h4 className="font-medium">Itemized Materials</h4>
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    startContent={<Plus size={16} />}
                                    onPress={() => handleAddMaterial(taskIndex)}
                                    id={`${buttonId}-add-material-${taskIndex}`}
                                  >
                                    Add Material
                                  </Button>
                                </div>

                                {!task.materials || task.materials.length === 0 ? (
                                  <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
                                    <p className="text-muted-foreground mb-2 text-sm">
                                      No materials added yet.
                                    </p>
                                    <Button
                                      size="sm"
                                      variant="flat"
                                      color="primary"
                                      startContent={<Plus size={16} />}
                                      onPress={() => handleAddMaterial(taskIndex)}
                                    >
                                      Add Material
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full table-auto">
                                      <thead className="bg-default-100">
                                        <tr>
                                          <th className="px-3 py-2 text-left">Material</th>
                                          <th className="px-3 py-2 text-left">Qty</th>
                                          <th className="px-3 py-2 text-left">Unit Price</th>
                                          <th className="px-3 py-2 text-left">Total</th>
                                          <th className="px-3 py-2 text-right">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {task.materials.map((material, materialIndex) => (
                                          <tr key={materialIndex} className="border-b">
                                            <td className="px-3 py-2">
                                              <div className="font-medium">{material.name}</div>
                                              {material.description && (
                                                <div className="text-muted-foreground text-sm">
                                                  {material.description}
                                                </div>
                                              )}
                                            </td>
                                            <td className="px-3 py-2">{material.quantity}</td>
                                            <td className="px-3 py-2">
                                              {formatCurrency(material.unitPrice)}
                                            </td>
                                            <td className="px-3 py-2">
                                              {formatCurrency(
                                                material.quantity * material.unitPrice
                                              )}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                              <div className="flex justify-end gap-1">
                                                <Button
                                                  isIconOnly
                                                  size="sm"
                                                  variant="light"
                                                  onPress={() =>
                                                    handleEditMaterial(taskIndex, materialIndex)
                                                  }
                                                  aria-label="Edit material"
                                                  id={`${buttonId}-edit-material-${taskIndex}-${materialIndex}`}
                                                >
                                                  <Edit size={16} />
                                                </Button>
                                                <Button
                                                  isIconOnly
                                                  size="sm"
                                                  variant="light"
                                                  color="danger"
                                                  onPress={() =>
                                                    handleRemoveMaterial(taskIndex, materialIndex)
                                                  }
                                                  aria-label="Remove material"
                                                  id={`${buttonId}-remove-material-${taskIndex}-${materialIndex}`}
                                                >
                                                  <Trash2 size={16} />
                                                </Button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                        <tr>
                                          <td
                                            colSpan={3}
                                            className="px-3 py-2 text-right font-medium"
                                          >
                                            Materials Subtotal:
                                          </td>
                                          <td colSpan={2} className="px-3 py-2 font-medium">
                                            {formatCurrency(
                                              task.materials ? getMaterialsTotal(task as TaskFormData) : 0
                                            )}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="mt-4 flex justify-end">
                              <div className="text-right">
                                <div className="text-muted-foreground mb-1 text-sm">Task Total</div>
                                <div className="text-lg font-bold">
                                  {formatCurrency(getTaskTotal(task as TaskFormData))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
            <CardFooter>
              <Button
                color="primary"
                variant="flat"
                startContent={<Plus size={16} />}
                onPress={handleAddTask}
                fullWidth
              >
                Add Another Task
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Quote Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Quote Summary</h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-2 font-medium">Pricing Adjustments</h3>
                      <div className="space-y-3">
                        <NumberInput
                          label="Markup Percentage (%)"
                          value={formData.markupPercentage || 0}
                          onValueChange={(value) => handleFormChange('markupPercentage', value)}
                          endContent="%"
                          min={0}
                          step={0.1}
                          formatOptions={{
                            style: 'decimal',
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          }}
                        />
                      </div>
                    </div>

                    <Divider />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>
                          {formatCurrency((formData.subtotalTasks ?? 0) + (formData.subtotalMaterials ?? 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Complexity Charge:</span>
                        <span>{formatCurrency(formData.complexityCharge ?? 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Markup Charge:</span>
                        <span>{formatCurrency(formData.markupCharge ?? 0)}</span>
                      </div>
                    </div>

                    <Divider />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(formData.grandTotal ?? 0)}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4">
                    <Button
                      color="primary"
                      onPress={() => handleSave()}
                      startContent={<Save size={16} />}
                      fullWidth
                      isLoading={isSubmitting}
                      isDisabled={isSubmitting}
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </form>
      {/* Material Modal */}
      <Modal isOpen={materialModalOpen} onClose={() => setMaterialModalOpen(false)} size="lg">
        <ModalContent>
          <ModalHeader>
            {currentMaterialIndexRef.current !== null ? 'Edit Material' : 'Add Material'}
          </ModalHeader>
          <ModalBody className="space-y-4">
            <Select
              label="Select Product (Optional)"
              placeholder="Choose from existing products"
              value={materialDataRef.current.productId || ''}
              onChange={(e) => handleProductSelect(e.target.value || null)}
            >
              {productsData?.items ? (
                productsData.items.map((product) => (
                  <SelectItem key={product.id} textValue={product.name}>
                    {product.name} - {formatCurrency(product.unitPrice)}
                  </SelectItem>
                ))
              ) : (
                <SelectItem key="empty" textValue="No products">
                  No products available
                </SelectItem>
              )}
            </Select>

            <Input
              label="Material Name"
              placeholder="Enter material name"
              value={materialDataRef.current.name || ''}
              onValueChange={(value) => handleMaterialChange('name', value)}
              isRequired
            />

            <Textarea
              label="Description (Optional)"
              placeholder="Enter material description"
              value={materialDataRef.current.description || ''}
              onValueChange={(value) => handleMaterialChange('description', value)}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NumberInput
                label="Quantity"
                value={materialDataRef.current.quantity || 1}
                onValueChange={(value) => handleMaterialChange('quantity', value)}
                min={1}
                step={1}
                formatOptions={{ style: 'decimal', maximumFractionDigits: 0 }}
                isRequired
              />

              <NumberInput
                label="Unit Price"
                value={
                  materialDataRef.current.unitPrice === undefined
                    ? 0
                    : Number(materialDataRef.current.unitPrice)
                }
                onValueChange={(value) => handleMaterialChange('unitPrice', value)}
                startContent="$"
                min={0}
                step={0.01}
                formatOptions={{
                  style: 'decimal',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
                isRequired
              />
            </div>

            <Textarea
              label="Notes (Optional)"
              placeholder="Enter any notes about this material"
              value={materialDataRef.current.notes || ''}
              onValueChange={(value) => handleMaterialChange('notes', value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setMaterialModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSaveMaterial}>
              {currentMaterialIndexRef.current !== null ? 'Update' : 'Add'} Material
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default EditQuotePage;
