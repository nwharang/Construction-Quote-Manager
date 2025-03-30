'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  CardFooter,
  Breadcrumbs,
  BreadcrumbItem,
  Badge,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import { Edit, Trash2, MoreVertical, ArrowLeft, Download, Mail, Copy, Printer } from 'lucide-react';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { useToastStore } from '~/store';
import { formatCurrency } from '~/utils/currency';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { Material, Task, Quote } from '~/types/quote';

export default function QuoteDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { status } = useSession();
  const { formatCurrency, formatDate } = useTranslation();
  const toast = useToastStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // State for quote data
  const [quote, setQuote] = useState<Quote | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Get quote query
  const { data: quoteData } = api.quote.getById.useQuery(
    { id: typeof id === 'string' ? id : '' },
    { enabled: typeof id === 'string', refetchOnWindowFocus: false }
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
      // Refetch quote data
      if (id && typeof id === 'string') {
        fetchQuoteById(id);
      }
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
      console.error('Error updating quote status:', error);
    },
  });

  // Fetch a quote by ID
  const fetchQuoteById = useCallback(
    async (quoteId: string) => {
      try {
        setLoading(true);
        // Use the API client directly for the direct call
        const response = await api.quote.getById.query({ id: quoteId });

        if (response) {
          setQuote(response);

          // Populate tasks if available
          if (response.tasks && Array.isArray(response.tasks)) {
            setTasks(response.tasks);
          }
        }
      } catch (error: unknown) {
        console.error('Error fetching quote:', error);
        toast.error('Failed to load quote');
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Update from quote data when it changes
  useEffect(() => {
    if (quoteData) {
      setQuote(quoteData);

      // Populate tasks if available
      if (quoteData.tasks && Array.isArray(quoteData.tasks)) {
        setTasks(quoteData.tasks);
      }
    }
  }, [quoteData]);

  // Set mounted state on initial render only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle quote deletion
  const handleDeleteQuote = async () => {
    if (id && typeof id === 'string') {
      try {
        setIsSubmitting(true);
        await deleteQuoteMutation.mutateAsync({ id });
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
    if (id && typeof id === 'string') {
      try {
        setIsSubmitting(true);
        await updateStatusMutation.mutateAsync({
          id,
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
      const element = printRef.current;

      // Set higher quality for PDF generation
      const canvas = await html2canvas(element, {
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
      pdf.save(`quote-${id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  // Get status color
  const getStatusColor = (
    status: string
  ): 'primary' | 'success' | 'warning' | 'danger' | 'default' => {
    switch (status.toLowerCase()) {
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
    switch (status.toLowerCase()) {
      case 'draft':
        return 'Draft';
      case 'sent':
        return 'Sent';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getMaterialsTotal = (materials: Material[]): number => {
    return materials.reduce((sum: number, material: Material) => {
      return sum + material.quantity * material.unitPrice;
    }, 0);
  };

  const getLaborTotal = (tasks: Task[]): number => {
    return tasks.reduce((sum: number, task: Task) => sum + parseFloat(task.price.toString()), 0);
  };

  // Calculate quote totals
  const calculateTotals = () => {
    if (!tasks) return { subtotal: 0, tax: 0, total: 0 };

    // Calculate subtotal
    const subtotal = tasks.reduce((total, task) => {
      const taskTotal = parseFloat(task.price.toString()) || 0;

      // Add materials cost based on material type
      if (task.materialType === 'lumpsum') {
        return total + taskTotal + (task.estimatedMaterialsCostLumpSum || 0);
      } else {
        const materialsTotal = task.materials.reduce((sum, material) => {
          return sum + material.quantity * material.unitPrice;
        }, 0);
        return total + taskTotal + materialsTotal;
      }
    }, 0);

    // Calculate tax if applicable
    const taxRate = quote?.taxRate || 0;
    const tax = subtotal * (taxRate / 100);

    // Calculate total
    const total = subtotal + tax;

    return { subtotal, tax, total };
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
        <title>{quote.title} | Quote Details</title>
      </Head>

      <div className="container mx-auto p-4">
        <div className="no-print mb-6">
          <Breadcrumbs>
            <BreadcrumbItem href="/admin">Dashboard</BreadcrumbItem>
            <BreadcrumbItem href="/admin/quotes">Quotes</BreadcrumbItem>
            <BreadcrumbItem>{quote.title}</BreadcrumbItem>
          </Breadcrumbs>

          <div className="mt-4 flex flex-col items-start justify-between md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold">{quote.title}</h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge color={getStatusColor(quote.status)} variant="solid">
                  {getStatusDisplay(quote.status)}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  Created {formatDate(quote.createdAt)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2 md:mt-0">
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="flat" color="primary" aria-label="Change quote status">
                    Change Status
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Quote status options">
                  <DropdownItem
                    key="draft"
                    onPress={() => handleStatusChange('DRAFT')}
                    startContent={
                      <Badge color="default" variant="solid">
                        Draft
                      </Badge>
                    }
                  >
                    Mark as Draft
                  </DropdownItem>
                  <DropdownItem
                    key="sent"
                    onPress={() => handleStatusChange('SENT')}
                    startContent={
                      <Badge color="primary" variant="solid">
                        Sent
                      </Badge>
                    }
                  >
                    Mark as Sent
                  </DropdownItem>
                  <DropdownItem
                    key="accepted"
                    onPress={() => handleStatusChange('ACCEPTED')}
                    startContent={
                      <Badge color="success" variant="solid">
                        Accepted
                      </Badge>
                    }
                  >
                    Mark as Accepted
                  </DropdownItem>
                  <DropdownItem
                    key="rejected"
                    onPress={() => handleStatusChange('REJECTED')}
                    startContent={
                      <Badge color="danger" variant="solid">
                        Rejected
                      </Badge>
                    }
                  >
                    Mark as Rejected
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Button
                as={Link}
                href={`/admin/quotes/${id}/edit`}
                color="primary"
                variant="flat"
                startContent={<Edit size={16} />}
                aria-label="Edit quote"
              >
                Edit
              </Button>

              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="light" aria-label="More options">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Quote actions">
                  <DropdownItem
                    key="print"
                    startContent={<Printer size={16} />}
                    as="a"
                    href={`/admin/quotes/${id}/print`}
                    target="_blank"
                  >
                    View Printable Version
                  </DropdownItem>
                  <DropdownItem
                    key="download"
                    startContent={<Download size={16} />}
                    onPress={handleDownloadPDF}
                  >
                    Download PDF
                  </DropdownItem>
                  <DropdownItem key="email" startContent={<Mail size={16} />}>
                    Email to Customer
                  </DropdownItem>
                  <DropdownItem key="duplicate" startContent={<Copy size={16} />}>
                    Duplicate Quote
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    startContent={<Trash2 size={16} />}
                    onPress={() => setDeleteConfirmOpen(true)}
                  >
                    Delete Quote
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>

        <div
          id="printable-area"
          ref={printRef}
          className="print-grid grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {/* Header for printed version */}
          <div className="print-header hidden print:col-span-3 print:block">
            {/* Company Logo & Info Area */}
            <div className="print-logo-area">
              <div className="print-logo">
                {/* Logo placeholder - could be replaced with actual company logo */}
                <h1 className="text-xl font-bold">Construction Quote Manager</h1>
              </div>
              <div className="print-company-info">
                <div className="print-company-name">Your Company Name</div>
                <div>123 Construction Avenue</div>
                <div>Builder City, BC 12345</div>
                <div>Phone: (555) 123-4567</div>
                <div>Email: info@yourcompany.com</div>
              </div>
            </div>

            <div className="mb-4 flex flex-col items-start">
              <h1 className="text-3xl font-bold">{quote.title}</h1>
              <div className="mt-2 flex items-center gap-2">
                <Badge color={getStatusColor(quote.status)} variant="solid" size="lg">
                  {getStatusDisplay(quote.status)}
                </Badge>
                <span className="text-md">
                  Quote #: {quote.sequentialId} | Created on {formatDate(quote.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Quote Information */}
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-xl font-semibold">Quote Information</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-muted-foreground text-sm">Quote #</h3>
                    <p>{quote.sequentialId}</p>
                  </div>
                  <div>
                    <h3 className="text-muted-foreground text-sm">Project</h3>
                    <p>{quote.title}</p>
                  </div>
                  <div>
                    <h3 className="text-muted-foreground text-sm">Status</h3>
                    <Badge color={getStatusColor(quote.status)}>
                      {getStatusDisplay(quote.status)}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-muted-foreground text-sm">Created</h3>
                    <p>{formatDate(quote.createdAt)}</p>
                  </div>
                  {quote.validUntil && (
                    <div>
                      <h3 className="text-muted-foreground text-sm">Valid Until</h3>
                      <p>{formatDate(quote.validUntil)}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Customer Information */}
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-xl font-semibold">Customer Information</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-muted-foreground text-sm">Name</h3>
                    <p>{quote.customerName}</p>
                  </div>
                  {quote.customerEmail && (
                    <div>
                      <h3 className="text-muted-foreground text-sm">Email</h3>
                      <p>{quote.customerEmail}</p>
                    </div>
                  )}
                  {quote.customerPhone && (
                    <div>
                      <h3 className="text-muted-foreground text-sm">Phone</h3>
                      <p>{quote.customerPhone}</p>
                    </div>
                  )}
                  {quote.customerAddress && (
                    <div>
                      <h3 className="text-muted-foreground text-sm">Address</h3>
                      <p className="whitespace-pre-line">{quote.customerAddress}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Quote Details - Tasks and Materials */}
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-xl font-semibold">Quote Details</h2>
              </CardHeader>
              <CardBody>
                {tasks && tasks.length > 0 ? (
                  <div className="space-y-8">
                    {tasks.map((task) => (
                      <div key={task.id} className="rounded-lg border p-4">
                        <div className="mb-4">
                          <h3 className="text-lg font-medium">
                            {task.name || `Task ${task.order || 0 + 1}`}
                          </h3>
                          <p className="whitespace-pre-line">{task.description}</p>
                        </div>

                        <div className="mb-2 grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-muted-foreground text-sm">Labor</h4>
                            <p className="font-medium">
                              {formatCurrency(parseFloat(task.price.toString()))}
                            </p>
                          </div>
                        </div>

                        {/* Materials Section */}
                        <div className="mt-4">
                          <h4 className="text-muted-foreground mb-2 text-sm">Materials</h4>
                          {task.materialType === 'lumpsum' ? (
                            <div className="text-md">
                              <span className="font-medium">
                                Estimated Materials Cost:{' '}
                                {formatCurrency(task.estimatedMaterialsCostLumpSum || 0)}
                              </span>
                            </div>
                          ) : (
                            <>
                              {task.materials && task.materials.length > 0 ? (
                                <Table aria-label="Materials table" className="min-w-full">
                                  <TableHeader>
                                    <TableColumn>Item</TableColumn>
                                    <TableColumn>Quantity</TableColumn>
                                    <TableColumn>Unit Price</TableColumn>
                                    <TableColumn>Total</TableColumn>
                                  </TableHeader>
                                  <TableBody>
                                    {task.materials.map((material) => (
                                      <TableRow key={material.id}>
                                        <TableCell>{material.name}</TableCell>
                                        <TableCell>{material.quantity}</TableCell>
                                        <TableCell>{formatCurrency(material.unitPrice)}</TableCell>
                                        <TableCell>
                                          {formatCurrency(material.quantity * material.unitPrice)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    <TableRow key="subtotal">
                                      <TableCell colSpan={3} className="text-right font-medium">
                                        Materials Subtotal:
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        {formatCurrency(getMaterialsTotal(task.materials))}
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              ) : (
                                <p className="text-muted-foreground italic">
                                  No materials specified
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        <div className="mt-4 text-right">
                          <p className="text-muted-foreground text-sm">
                            Task Total:{' '}
                            <span className="font-medium">
                              {formatCurrency(
                                parseFloat(task.price.toString()) +
                                  (task.materialType === 'lumpsum'
                                    ? task.estimatedMaterialsCostLumpSum || 0
                                    : getMaterialsTotal(task.materials))
                              )}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No tasks added to this quote</p>
                )}
              </CardBody>
            </Card>

            {/* Notes */}
            {quote.notes && (
              <Card className="mb-6">
                <CardHeader>
                  <h2 className="text-xl font-semibold">Notes</h2>
                </CardHeader>
                <CardBody>
                  <p className="whitespace-pre-line">{quote.notes}</p>
                </CardBody>
              </Card>
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
                    {/* Labor total */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Labor:</span>
                      <span>{formatCurrency(getLaborTotal(tasks))}</span>
                    </div>

                    {/* Materials total */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Materials:</span>
                      <span>
                        {formatCurrency(
                          tasks.reduce((sum, task) => {
                            return (
                              sum +
                              (task.materialType === 'lumpsum'
                                ? task.estimatedMaterialsCostLumpSum || 0
                                : getMaterialsTotal(task.materials))
                            );
                          }, 0)
                        )}
                      </span>
                    </div>

                    <div className="my-2 border-t border-gray-200 pt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>{formatCurrency(quote.subtotal || calculateTotals().subtotal)}</span>
                      </div>
                    </div>

                    {/* Complexity charge */}
                    {quote.complexityCharge > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Complexity/Contingency:
                          {quote.complexityPercentage > 0 &&
                            ` (${quote.complexityPercentage.toFixed(1)}%)`}
                        </span>
                        <span>{formatCurrency(quote.complexityCharge)}</span>
                      </div>
                    )}

                    {/* Markup charge */}
                    {quote.markupCharge > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Markup:
                          {quote.markupPercentage > 0 && ` (${quote.markupPercentage.toFixed(1)}%)`}
                        </span>
                        <span>{formatCurrency(quote.markupCharge)}</span>
                      </div>
                    )}

                    {/* Tax if applicable */}
                    {quote.taxRate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Tax ({quote.taxRate.toFixed(1)}%):
                        </span>
                        <span>{formatCurrency(calculateTotals().tax)}</span>
                      </div>
                    )}

                    {/* Grand total */}
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(quote.grandTotal || calculateTotals().total)}</span>
                      </div>
                    </div>

                    {/* Print, Email, Download buttons */}
                    <div className="mt-6 space-y-2 pt-4">
                      <Button
                        as="a"
                        href={`/admin/quotes/${id}/print`}
                        target="_blank"
                        color="primary"
                        variant="flat"
                        startContent={<Printer size={16} />}
                        className="w-full"
                      >
                        View Printable Version
                      </Button>
                      <Button
                        color="primary"
                        variant="flat"
                        startContent={<Download size={16} />}
                        className="w-full"
                        onPress={handleDownloadPDF}
                      >
                        Download as PDF
                      </Button>
                      <Button
                        color="primary"
                        variant="flat"
                        startContent={<Mail size={16} />}
                        className="w-full"
                      >
                        Email to Customer
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
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
