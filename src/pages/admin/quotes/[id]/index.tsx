'use client';

import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Button,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  Breadcrumbs,
  BreadcrumbItem,
  Badge,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
} from '@heroui/react';
import { Edit, Trash2, MoreVertical, ArrowLeft, Download, Mail, Copy, Printer } from 'lucide-react';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { useToastStore } from '~/store';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';
import { QuoteHeader } from '~/components/quotes/QuoteHeader';
import { CustomerInfoForm } from '~/components/quotes/CustomerInfoForm';
import { TaskList } from '~/components/quotes/TaskList';
import { QuoteSummary } from '~/components/quotes/QuoteSummary';
import { MaterialInputRow } from '~/components/quotes/MaterialInputRow';

type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;
type QuoteResponse = NonNullable<RouterOutput['quote']['getById']>;
type Material = NonNullable<NonNullable<QuoteResponse['tasks']>[number]['materials']>[number];
type Task = NonNullable<QuoteResponse['tasks']>[number];
type TaskFormData = NonNullable<RouterInput['quote']['update']['tasks']>[number];
type MaterialFormData = NonNullable<NonNullable<TaskFormData['materials']>[number]>;

export default function QuoteDetailPage() {
  const router = useRouter();
  const { id: quoteId } = router.query;
  const { data: session, status: sessionStatus } = useSession();
  const { formatCurrency, formatDate } = useTranslation();
  const toast = useToastStore();
  const [mounted, setMounted] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // State for quote data
  const [tasks, setTasks] = useState<Task[]>([]);

  // Get quote with tRPC
  const {
    data: quote,
    isLoading,
    refetch,
  } = api.quote.getById.useQuery(
    { id: typeof quoteId === 'string' ? quoteId : '' },
    {
      enabled: typeof quoteId === 'string' && sessionStatus === 'authenticated',
    }
  );

  // Delete quote mutation
  const deleteQuoteMutation = api.quote.delete.useMutation({
    onSuccess: () => {
      toast.success('Quote deleted successfully');
      router.push('/admin/quotes');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      console.error('Error deleting quote:', error);
    },
  });

  // Update quote status mutation
  const updateStatusMutation = api.quote.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Quote status updated successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      console.error('Error updating quote status:', error);
    },
  });

  // Set mounted state on initial render only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle quote deletion
  const handleDeleteQuote = async () => {
    if (quoteId && typeof quoteId === 'string' && quoteId.length > 0) {
      try {
        setIsSubmitting(true);
        await deleteQuoteMutation.mutateAsync({ id: quoteId });
      } catch (error) {
        console.error('Error deleting quote:', error);
      } finally {
        setIsSubmitting(false);
        setDeleteConfirmOpen(false);
      }
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED') => {
    if (quoteId && typeof quoteId === 'string' && quoteId.length > 0) {
      try {
        setIsSubmitting(true);
        await updateStatusMutation.mutateAsync({
          id: quoteId,
          status: newStatus,
        });
      } catch (error) {
        console.error('Error updating quote status:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    try {
      // Set higher quality for PDF generation
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const data = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const imgProps = pdf.getImageProperties(data);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`quote-${quote?.sequentialId || quote?.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  // Get status color
  const getStatusColor = (
    status: string
  ): 'primary' | 'success' | 'warning' | 'danger' | 'default' => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'default';
      case 'sent':
        return 'primary';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Get status display name
  const getStatusDisplay = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'Draft';
      case 'sent':
        return 'Sent';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return status || 'Draft';
    }
  };

  const getMaterialsTotal = (materials: Material[]): number => {
    return materials.reduce((sum: number, material: Material) => {
      const quantity = material.quantity ?? 0;
      const unitPrice =
        typeof material.unitPrice === 'string'
          ? parseFloat(material.unitPrice)
          : material.unitPrice;
      return sum + quantity * unitPrice;
    }, 0);
  };

  const getLaborTotal = (tasks: Task[]): number => {
    return tasks.reduce((sum: number, task: Task) => {
      const price = typeof task.price === 'string' ? parseFloat(task.price) : task.price;
      return sum + price;
    }, 0);
  };

  // Calculate quote totals
  const calculateTotals = () => {
    if (!quote || !quote.tasks || quote.tasks.length === 0)
      return { subtotal: 0, tax: 0, total: 0 };

    // Calculate subtotal
    const total = quote.tasks.reduce((total, task) => {
      const taskTotal = typeof task.price === 'string' ? parseFloat(task.price) : task.price;

      // Add materials cost based on material type
      const estimatedMaterialsCost =
        typeof task.estimatedMaterialsCost === 'string'
          ? parseFloat(task.estimatedMaterialsCost)
          : (task.estimatedMaterialsCost ?? 0);
      return total + taskTotal + estimatedMaterialsCost;
    }, 0);

    return { total };
  };

  const getTaskTotal = (task: TaskFormData) => {
    const laborCost = task.price || 0;
    const materialsCost = task.materialType === 'lumpsum' 
      ? task.estimatedMaterialsCostLumpSum || 0
      : (task.materials || []).reduce((sum: number, material: MaterialFormData) => 
          sum + (material.quantity || 0) * (material.unitPrice || 0), 0);
    return laborCost + materialsCost;
  };

  // Render loading state
  if (!mounted || sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Render not found state
  if (!quote) {
    return (
      <div className="container mx-auto p-4">
        <div className="py-12 text-center">
          <h2 className="mb-4 text-2xl font-bold">Quote Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The quote you're looking for doesn't exist or has been removed.
          </p>
          <Button
            color="primary"
            onPress={() => router.push('/admin/quotes')}
            startContent={<ArrowLeft size={16} />}
          >
            Back to Quotes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{quote?.title || 'Quote Details'} | Quote Details</title>
      </Head>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{quote?.title}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge color={getStatusColor(quote?.status || 'DRAFT')} variant="solid">
                {getStatusDisplay(quote?.status || 'DRAFT')}
              </Badge>
              <span className="text-muted-foreground text-sm">
                Created {quote?.createdAt ? formatDate(quote.createdAt) : ''}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              color="primary"
              onPress={() => router.push(`/admin/quotes/${quoteId}/edit`)}
              startContent={<Edit size={16} />}
            >
              Edit Quote
            </Button>
            <Button
              color="danger"
              variant="flat"
              onPress={() => setDeleteConfirmOpen(true)}
              startContent={<Trash2 size={16} />}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <QuoteHeader />
            <CustomerInfoForm />
            <TaskList
              tasks={quote.tasks.map((task, index) => ({
                description: task.description,
                price: typeof task.price === 'string' ? parseFloat(task.price) : task.price,
                materialType: task.materialType?.toLowerCase() as 'itemized' | 'lumpsum',
                materials: task.materials?.map(material => ({
                  name: material.productId ?? '',
                  quantity: material.quantity ?? 0,
                  unitPrice: typeof material.unitPrice === 'string' ? parseFloat(material.unitPrice) : material.unitPrice,
                  notes: material.notes ?? undefined,
                  productId: material.productId ?? undefined,
                })) ?? [],
                status: 'PENDING' as const,
                estimatedMaterialsCostLumpSum: task.estimatedMaterialsCost ? parseFloat(task.estimatedMaterialsCost) : 0,
                index
              }))}
              onAddTask={() => {}}
              onRemoveTask={() => {}}
              onUpdateTask={() => {}}
              onAddMaterial={() => {}}
              onRemoveMaterial={() => {}}
              onUpdateMaterial={() => {}}
              readOnly={true}
            >
              {(task: TaskFormData) => (
                <div>
                  {task.materials.map((material: MaterialFormData, materialIndex: number) => (
                    <MaterialInputRow
                      key={materialIndex}
                      material={material}
                      taskIndex={task.index}
                      materialIndex={materialIndex}
                      onUpdate={(taskIndex: number, materialIndex: number, material: MaterialFormData) => {
                        // Implement the logic to update the material in the task
                      }}
                      onRemove={(taskIndex: number, materialIndex: number) => {
                        // Implement the logic to remove the material from the task
                      }}
                      readOnly={true}
                    />
                  ))}
                  <div className="mt-4 flex justify-between items-center">
                    <Chip
                      color={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'warning' : 'default'}
                      variant="flat"
                    >
                      {task.status || 'PENDING'}
                    </Chip>
                    <div className="text-right">
                      <div className="text-muted-foreground mb-1 text-sm">Task Total</div>
                      <div className="text-lg font-bold">
                        {formatCurrency(getTaskTotal(task))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TaskList>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <QuoteSummary
              data={{
                subtotalTasks:
                  typeof quote.subtotalTasks === 'string'
                    ? parseFloat(quote.subtotalTasks)
                    : quote.subtotalTasks,
                subtotalMaterials:
                  typeof quote.subtotalMaterials === 'string'
                    ? parseFloat(quote.subtotalMaterials)
                    : quote.subtotalMaterials,
                complexityCharge:
                  typeof quote.complexityCharge === 'string'
                    ? parseFloat(quote.complexityCharge)
                    : quote.complexityCharge,
                markupCharge:
                  typeof quote.markupCharge === 'string'
                    ? parseFloat(quote.markupCharge)
                    : quote.markupCharge,
                grandTotal:
                  typeof quote.grandTotal === 'string'
                    ? parseFloat(quote.grandTotal)
                    : quote.grandTotal,
              }}
              onUpdate={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} backdrop="blur">
        <ModalContent>
          <ModalHeader>Delete Quote</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete this quote? This action cannot be undone and all
              associated data will be permanently deleted.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteQuote}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
            >
              Delete Quote
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
