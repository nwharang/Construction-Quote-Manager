import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Spinner,
  Input,
  Textarea,
} from '@heroui/react';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { api } from '~/utils/api';
import { useToastStore } from '~/store';
import { useTranslation } from '~/hooks/useTranslation';
import { CustomerSelect } from '~/components/customers/CustomerSelect';
import { TaskList } from '~/components/quotes/TaskList';
import { QuoteSummary } from '~/components/quotes/QuoteSummary';
import { useQuoteStore } from '~/store/quoteStore';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';
import type { DateValue } from '@internationalized/date';

type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;
type CreateQuoteInput = RouterInput['quote']['create'];
type QuoteFormData = {
  title: string;
  customerId: string;
  notes?: string;
  tasks: TaskFormData[];
  complexityCharge?: number;
  markupCharge?: number;
};
type TaskFormData = {
  description: string;
  price: number;
  materials: {
    name: string;
    quantity: number;
    unitPrice: number;
    productId?: string;
    notes?: string;
  }[];
};

export default function NewQuotePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const toast = useToastStore();
  const { formatCurrency } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalControll, setModalControll] = useState(false);

  const {
    formData,
    resetForm,
    updateField,
    addTask,
    removeTask,
    updateTask,
    addMaterial,
    removeMaterial,
    updateMaterial,
  } = useQuoteStore();

  // Create quote mutation
  const createQuoteMutation = api.quote.create.useMutation({
    onSuccess: () => {
      toast.success('Quote created successfully');
      router.push('/admin/quotes');
    },
    onError: (error) => {
      toast.error(`Error creating quote: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Set mounted state and reset form on mount
  useEffect(() => {
    setMounted(true);
    resetForm();
  }, [resetForm]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.customerId) {
      toast.error('Please select a customer');
      return;
    }

    setIsSubmitting(true);
    createQuoteMutation.mutate({
      title: formData.title,
      customerId: formData.customerId,
      notes: formData.notes || '',
      tasks: formData.tasks.map((task) => ({
        description: task.description,
        price: task.price,
        materialType: task.materials.length > 0 ? 'itemized' : 'lumpsum',
        materials: task.materials.map((material) => ({
          name: material.name,
          quantity: material.quantity,
          unitPrice: material.unitPrice,
          productId: material.productId || '',
          notes: material.notes || undefined,
        })),
      })),
    });
  };

  // Handle customer selection
  const handleCustomerChange = (customerId: string | null, customerData?: any) => {
    updateField('customerId', customerId || '');
  };

  // Show loading state
  if (!mounted || sessionStatus === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <>
      <Head>
        <title>New Quote - Admin Dashboard</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
            Save Quote
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Quote Information */}
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-xl font-semibold">Quote Information</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Quote Title"
                  placeholder="Enter a name for this quote"
                  value={formData.title}
                  onChange={(e) => updateField('title' as keyof QuoteFormData, e.target.value)}
                  required
                />
                <Textarea
                  label="Notes (Optional)"
                  placeholder="Enter any additional notes about this quote"
                  value={formData.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                />
              </CardBody>
            </Card>

            {/* Customer Information */}
            <Card className="mb-6">
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Customer Information</h2>
                <Button
                  isIconOnly
                  color="primary"
                  variant="flat"
                  aria-label="Create new customer"
                  onPress={() => setModalControll(true)}
                  className="self-end"
                >
                  <UserPlus size={18} />
                </Button>
              </CardHeader>
              <CardBody>
                <CustomerSelect
                  value={formData.customerId || null}
                  onChange={handleCustomerChange}
                  modalControll={[modalControll, setModalControll]}
                />
              </CardBody>
            </Card>

            {/* Tasks */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Tasks</h2>
              </CardHeader>
              <CardBody>
                <TaskList
                  tasks={formData.tasks}
                  onAddTask={() => {
                    addTask();
                  }}
                  onRemoveTask={(index: number) => {
                    removeTask(index);
                  }}
                  onUpdateTask={(index: number, task: TaskFormData) => {
                    updateTask(index, task);
                  }}
                  onAddMaterial={(taskIndex: number) => {
                    addMaterial(taskIndex);
                  }}
                  onRemoveMaterial={(taskIndex: number, materialIndex: number) => {
                    removeMaterial(taskIndex, materialIndex);
                  }}
                  onUpdateMaterial={(
                    taskIndex: number,
                    materialIndex: number,
                    material: TaskFormData['materials'][0]
                  ) => {
                    updateMaterial(taskIndex, materialIndex, material);
                  }}
                />
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <QuoteSummary
              data={{
                subtotalTasks: formData.tasks.reduce((sum: number, task: TaskFormData) => sum + task.price, 0),
                subtotalMaterials: formData.tasks.reduce(
                  (sum: number, task: TaskFormData) =>
                    sum +
                    task.materials.reduce(
                      (materialSum: number, material: TaskFormData['materials'][0]) =>
                        materialSum + material.quantity * material.unitPrice,
                      0
                    ),
                  0
                ),
                complexityCharge: formData.complexityCharge || 0,
                markupCharge: formData.markupCharge || 0,
                grandTotal:
                  formData.tasks.reduce((sum: number, task: TaskFormData) => sum + task.price, 0) +
                  formData.tasks.reduce(
                    (sum: number, task: TaskFormData) =>
                      sum +
                      task.materials.reduce(
                        (materialSum: number, material: TaskFormData['materials'][0]) =>
                          materialSum + material.quantity * material.unitPrice,
                        0
                      ),
                    0
                  ) +
                  (formData.complexityCharge || 0) +
                  (formData.markupCharge || 0),
              }}
              onUpdate={(field: keyof QuoteFormData, value: number) => {
                // Handle updates
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
