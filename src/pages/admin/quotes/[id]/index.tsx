import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Printer, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import { api } from '~/utils/api';
import { useAppToast } from '~/components/providers/ToastProvider';
import { useTranslation } from '~/hooks/useTranslation';
import type { RouterOutputs } from '~/utils/api';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '~/server/api/root';
import { useTrpcErrorHandling } from '~/hooks/useTrpcWithErrorHandling';

type Quote = RouterOutputs['quote']['getById'];
type Task = RouterOutputs['task']['getByQuoteId'][number];
type QuoteStatus = Quote['status'];

interface Material {
  id: string;
  name: string;
  description: string | null;
  price: string;
  quantity: number;
}

export default function QuoteDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: authStatus } = useSession();
  const toast = useAppToast();
  const { formatDate, formatCurrency } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [isLoading, setIsLoading] = useState(false);

  // Fetch quote details
  const quoteQuery = useTrpcErrorHandling(
    api.quote.getById.useQuery(
      { id: id as string },
      { enabled: !!id && authStatus === 'authenticated' }
    ),
    {
      fallbackMessage: 'Failed to load quote details',
    }
  );

  // Fetch tasks for the quote
  const tasksQuery = useTrpcErrorHandling(
    api.task.getByQuoteId.useQuery(
      { quoteId: id as string },
      { enabled: !!id && authStatus === 'authenticated' }
    ),
    {
      fallbackMessage: 'Failed to load quote tasks',
    }
  );

  // Delete quote mutation
  const deleteQuoteMutation = api.quote.delete.useMutation({
    onSuccess: () => {
      toast.success('Quote deleted successfully');
      router.push('/admin/quotes');
    },
    onError: (err: TRPCClientErrorLike<AppRouter>) => {
      toast.error(`Error deleting quote: ${err.message}`);
    },
  });

  // Update quote mutation
  const updateQuoteMutation = api.quote.update.useMutation({
    onSuccess: () => {
      toast.success('Quote status updated successfully');
      void quoteQuery.refetch();
    },
    onError: (err: TRPCClientErrorLike<AppRouter>) => {
      toast.error(`Error updating quote status: ${err.message}`);
    },
  });

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [authStatus, router]);

  const handleDelete = () => {
    if (!quoteQuery.data) return;
    if (confirm('Are you sure you want to delete this quote?')) {
      deleteQuoteMutation.mutate({ id: quoteQuery.data.id });
    }
  };

  const handleStatusUpdate = (status: QuoteStatus) => {
    if (!quoteQuery.data) return;
    const quote = quoteQuery.data;
    updateQuoteMutation.mutate({
      id: quote.id,
      title: quote.title,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail || undefined,
      customerPhone: quote.customerPhone || undefined,
      notes: quote.notes || undefined,
      status,
    });
  };

  const handlePrint = () => {
    window.print();
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

  const quote = quoteQuery.data;
  const tasks = tasksQuery.data || [];

  return (
    <>
      <Head>
        <title>Quote #{quote.id} | Construction Quote Manager</title>
      </Head>

      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                variant="light"
                onPress={() => router.back()}
                isDisabled={isLoading}
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Quote #{quote.id}</h1>
                <p className="text-muted-foreground">View quote details</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                color="primary"
                variant="flat"
                startContent={<Printer size={20} />}
                onPress={handlePrint}
                isDisabled={isLoading}
              >
                Print
              </Button>
              <Button
                color="primary"
                variant="flat"
                startContent={<Edit size={20} />}
                onPress={() => router.push(`/admin/quotes/${quote.id}/edit`)}
                isDisabled={isLoading}
              >
                Edit
              </Button>
              <Button
                color="danger"
                variant="flat"
                startContent={<Trash2 size={20} />}
                onPress={handleDelete}
                isLoading={deleteQuoteMutation.isPending}
                isDisabled={isLoading}
              >
                {deleteQuoteMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Quote Information</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Title</p>
                    <p className="font-medium">{quote.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Chip
                      className="capitalize"
                      color={
                        quote.status === 'DRAFT'
                          ? 'default'
                          : quote.status === 'SENT'
                          ? 'primary'
                          : quote.status === 'ACCEPTED'
                          ? 'success'
                          : 'danger'
                      }
                      size="sm"
                      variant="flat"
                    >
                      {quote.status.toLowerCase()}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(quote.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{formatDate(quote.updatedAt)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Customer Information</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{quote.customerName}</p>
                  </div>
                  {quote.customerEmail && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{quote.customerEmail}</p>
                    </div>
                  )}
                  {quote.customerPhone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{quote.customerPhone}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Tasks</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                {tasksQuery.isLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No tasks have been added to this quote yet.</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="border-b pb-6 last:border-0">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{task.description}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-medium">
                            {formatCurrency(Number(task.price))}
                          </p>
                        </div>
                      </div>

                      {task.materials && task.materials.length > 0 && (
                        <div className="ml-4">
                          <h4 className="font-medium mb-2">Materials</h4>
                          <div className="space-y-2">
                            {task.materials.map((material) => (
                              <div
                                key={material.id}
                                className="flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-medium">{material.notes || 'Material'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    {formatCurrency(Number(material.unitPrice))}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Charges</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-muted-foreground">Complexity Charge</p>
                  <p className="font-medium">{formatCurrency(Number(quote.complexityCharge))}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-muted-foreground">Markup Charge</p>
                  <p className="font-medium">{formatCurrency(Number(quote.markupCharge))}</p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="font-semibold">Total</p>
                  <p className="font-bold text-lg">{formatCurrency(Number(quote.grandTotal))}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {quote.notes && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Notes</h2>
              </CardHeader>
              <CardBody>
                <p className="whitespace-pre-wrap">{quote.notes}</p>
              </CardBody>
            </Card>
          )}

          <div className="flex justify-end gap-4">
            <Button
              color="danger"
              variant="light"
              onPress={() => router.back()}
              isDisabled={isLoading}
            >
              Back
            </Button>
            {quote.status === 'DRAFT' && (
              <Button
                color="primary"
                onPress={() => handleStatusUpdate('SENT')}
                isLoading={updateQuoteMutation.isPending}
                isDisabled={isLoading}
              >
                {updateQuoteMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  'Send Quote'
                )}
              </Button>
            )}
            {quote.status === 'SENT' && (
              <div className="flex gap-2">
                <Button
                  color="success"
                  onPress={() => handleStatusUpdate('ACCEPTED')}
                  isLoading={updateQuoteMutation.isPending}
                  isDisabled={isLoading}
                >
                  Accept
                </Button>
                <Button
                  color="danger"
                  onPress={() => handleStatusUpdate('REJECTED')}
                  isLoading={updateQuoteMutation.isPending}
                  isDisabled={isLoading}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          .no-print {
            display: none;
          }
          .container {
            max-width: none;
            padding: 0;
          }
          .card {
            break-inside: avoid;
            border: none;
            box-shadow: none;
          }
          .card-header {
            border-bottom: 1px solid #e5e7eb;
          }
          .card-body {
            padding: 1rem;
          }
        }
      `}} />
    </>
  );
} 