'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Button,
  Spinner,
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { Download, Printer } from 'lucide-react';
import { api } from '~/utils/api';
import { useToastStore } from '~/store';
import { useTranslation } from '~/hooks/useTranslation';
import {
  formatCurrency,
  formatDate,
  formatUserFriendlyId,
  formatPercentage,
} from '~/utils/formatters';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';
import type { NextPageWithLayout } from '~/types/next';
import PrintLayout from '~/layouts/PrintLayout';

type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;
type QuoteResponse = NonNullable<RouterOutput['quote']['getById']>;
type Task = NonNullable<QuoteResponse['tasks']>[number];
type MaterialItem = NonNullable<Task['materials']>[number];

interface PrintPageProps {}

const PrintQuotePage: NextPageWithLayout<PrintPageProps> = (props) => {
  const router = useRouter();
  const { id: quoteId } = router.query;
  const { status } = useSession();
  const toast = useToastStore();
  const { formatCurrency, formatDate, t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: fetchedQuoteData, isLoading } = api.quote.getById.useQuery(
    { id: typeof quoteId === 'string' ? quoteId : '' },
    {
      enabled: typeof quoteId === 'string' && status === 'authenticated',
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (fetchedQuoteData) {
      try {
        setQuoteData(fetchedQuoteData);

        if (fetchedQuoteData.tasks && Array.isArray(fetchedQuoteData.tasks)) {
          setTasks(fetchedQuoteData.tasks);
        }
        
      } catch (error) {
        console.error('Error processing quote data:', error);
        toast.error('Error loading quote data');
      }
    }
  }, [fetchedQuoteData, toast]);

  const handleDownloadPDF = async () => {
    if (!printRef.current || !quoteData) return;

    try {
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
      pdf.save(`quote-${quoteData.sequentialId || quoteData.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const getLaborTotal = (tasks: Task[]): number => {
    return tasks.reduce((sum: number, task: Task) => {
      const price = typeof task.price === 'string' ? parseFloat(task.price) : task.price;
      return sum + (price || 0);
    }, 0);
  };

  const getMaterialsTotal = (materials: MaterialItem[] = []): number => {
    return materials.reduce((sum: number, material: MaterialItem) => {
      const quantity = material.quantity ?? 0;
      const unitPrice =
        typeof material.unitPrice === 'string'
          ? parseFloat(material.unitPrice)
          : (material.unitPrice ?? 0);
      return sum + quantity * unitPrice;
    }, 0);
  };

  const calculatedTotals = useMemo(() => {
    if (!quoteData?.tasks || quoteData.tasks.length === 0)
      return {
        subtotalTasks: 0,
        subtotalMaterials: 0,
        grandTotal: 0,
      };

    const subtotalTasks = getLaborTotal(quoteData.tasks);
    const subtotalMaterials = quoteData.tasks.reduce((sum: number, task: Task) => {
      if (task.materialType === 'lumpsum') {
        return sum + (Number(task.estimatedMaterialsCost) || 0);
      } else {
        return sum + getMaterialsTotal(task.materials || []);
      }
    }, 0);

    const grandTotal = Number(quoteData.grandTotal) || 0;

    return {
      subtotalTasks,
      subtotalMaterials,
      grandTotal,
    };
  }, [quoteData]);

  if (!mounted || status === 'loading' || isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (!isLoading && !quoteData) {
    return (
      <div className="container mx-auto p-4">
        <div className="py-12 text-center">
          <h2 className="mb-4 text-2xl font-bold">Quote Not Found</h2>
          <p className="mb-6 text-gray-500">
            The quote you're looking for doesn't exist or has been removed.
          </p>
          <Button color="primary" onPress={() => router.push('/admin/quotes')}>
            Back to Quotes
          </Button>
        </div>
      </div>
    );
  }

  if (!quoteData) return null;

  return (
    <>
      <Head>
        <title>Quote #{quoteData.sequentialId || ''} | Print View</title>
      </Head>

      <div className="no-print fixed top-0 right-0 left-0 z-10 bg-white p-4 shadow-md print:hidden">
        <div className="container mx-auto flex justify-between">
          <Button variant="flat" onPress={() => router.back()}>
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="flat"
              color="primary"
              startContent={<Download size={16} />}
              onPress={handleDownloadPDF}
            >
              Download PDF
            </Button>
            <Button
              color="primary"
              startContent={<Printer size={16} />}
              onPress={() => window.print()}
            >
              Print
            </Button>
          </div>
        </div>
      </div>

      <div
        id="printable-area"
        ref={printRef}
        className="container mx-auto bg-white p-8 print:p-4 print:shadow-none"
      >
        <div className="mb-8 flex flex-col items-center justify-between border-b border-gray-300 pb-4 print:flex-row print:items-start print:border-b-2 print:border-black">
          <div>
            <h1 className="text-xl font-bold print:text-2xl">Construction Quote Manager</h1>
            <div className="text-sm text-gray-500 print:text-xs">
              <p>123 Construction Avenue, Builder City, State 12345</p>
              <p>Phone: (555) 123-4567 | Email: info@constructionquote.com</p>
            </div>
          </div>
          <div className="mt-4 text-center print:mt-0 print:text-right">
            <h2 className="mb-1 text-2xl font-bold text-gray-700 print:text-3xl">QUOTE</h2>
            <p className="text-sm text-gray-500 print:text-base">
              <span className="font-semibold">Quote #:</span> {quoteData.sequentialId}
            </p>
            <p className="text-sm text-gray-500 print:text-base">
              <span className="font-semibold">Date:</span> {formatDate(quoteData.createdAt)}
            </p>
            {quoteData.validUntil && (
              <p className="text-sm text-gray-500 print:text-base">
                <span className="font-semibold">Valid Until:</span>{' '}
                {formatDate(quoteData.validUntil)}
              </p>
            )}
            <p className="mt-2 text-sm font-medium uppercase print:mt-1 print:text-xs">
              STATUS: {quoteData.status}
            </p>
          </div>
        </div>

        <div className="mb-8 border-b border-gray-300 pb-4 print:border-b-2 print:border-black">
          <h1 className="text-xl font-bold print:text-2xl">{quoteData.title}</h1>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 print:grid-cols-2">
          {quoteData?.customer && (
            <div>
              <h3 className="mb-2 text-base font-bold text-gray-700 print:text-lg">
                Customer Information
              </h3>
              <div className="rounded-md border bg-gray-50 p-4 print:border-gray-300 print:bg-transparent print:p-0">
                <p className="font-semibold print:font-bold">{quoteData.customer.name}</p>
                {quoteData.customer.email && (
                  <p className="text-sm text-gray-600 print:text-sm">{quoteData.customer.email}</p>
                )}
                {quoteData.customer.phone && (
                  <p className="text-sm text-gray-600 print:text-sm">{quoteData.customer.phone}</p>
                )}
                {quoteData.customer.address && (
                  <p className="mt-1 text-sm whitespace-pre-line text-gray-600 print:text-sm">
                    {quoteData.customer.address}
                  </p>
                )}
              </div>
            </div>
          )}
          <div>
            <h3 className="mb-2 text-base font-bold text-gray-700 print:text-lg">Quote Summary</h3>
            <div className="rounded-md border bg-gray-50 p-4 print:border-none print:bg-transparent print:p-0">
              <div className="mb-1 flex justify-between print:mb-0.5">
                <span className="text-sm text-gray-600 print:text-sm">Labor:</span>
                <span className="text-sm print:text-sm">
                  {formatCurrency(calculatedTotals.subtotalTasks)}
                </span>
              </div>
              <div className="mb-1 flex justify-between print:mb-0.5">
                <span className="text-sm text-gray-600 print:text-sm">Materials:</span>
                <span className="text-sm print:text-sm">
                  {formatCurrency(calculatedTotals.subtotalMaterials)}
                </span>
              </div>

              {quoteData.markupCharge > 0 && (
                <div className="mb-1 flex justify-between print:mb-0.5">
                  <span className="text-sm text-gray-600 print:text-sm">
                    Markup ({formatPercentage(quoteData.markupPercentage)}):
                  </span>
                  <span className="text-sm print:text-sm">
                    {formatCurrency(quoteData.markupCharge)}
                  </span>
                </div>
              )}

              <div className="mt-2 border-t border-gray-300 pt-1 print:mt-1 print:border-t-2 print:border-black">
                <div className="flex justify-between font-bold print:text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(quoteData.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="mb-4 text-lg font-bold text-gray-700 print:mt-6 print:border-t print:border-black print:pt-4 print:text-xl">
            {t('quotes.tasksSectionTitle')}
          </h3>
          {quoteData.tasks && quoteData.tasks.length > 0 ? (
            <div className="space-y-4 print:space-y-3">
              {quoteData.tasks.map((task: Task, index: number) => (
                <div
                  key={task.id || index}
                  className="break-inside-avoid border-b border-gray-200 pb-3 print:border-none print:pb-2"
                >
                  <div className="mb-1 print:mb-0.5">
                    <p className="font-semibold print:text-base print:font-bold">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex justify-between text-sm print:text-xs">
                    <p>
                      {t('quotes.taskPriceLabel')}: {formatCurrency(task.price)}
                    </p>
                    <p>
                      {t('quotes.materialTypeLabel')}:{' '}
                      <span className="capitalize">{task.materialType || '-'}</span>
                    </p>
                  </div>

                  {task.materialType === 'lumpsum' && (
                    <div className="text-sm print:text-xs">
                      <p>
                        {t('quotes.estimatedMaterialCostLumpSumLabel')}:{' '}
                        {formatCurrency(task.estimatedMaterialsCost ?? 0)}
                      </p>
                    </div>
                  )}

                  {task.materialType === 'itemized' &&
                    task.materials &&
                    task.materials.length > 0 && (
                      <div className="mt-2 pl-4 print:mt-1 print:pl-2">
                        <Table
                          removeWrapper
                          aria-label={`Materials for task ${index + 1}`}
                          className="print:text-xs"
                          classNames={{ th: 'print:p-1 print:bg-transparent', td: 'print:p-1' }}
                        >
                          <TableHeader>
                            <TableColumn className="print:font-semibold">
                              {t('quotes.materialProductIdHeader')}
                            </TableColumn>
                            <TableColumn className="print:font-semibold">
                              {t('quotes.materialNotesHeader')}
                            </TableColumn>
                            <TableColumn className="text-right print:font-semibold">
                              {t('quotes.materialQuantityHeader')}
                            </TableColumn>
                            <TableColumn className="text-right print:font-semibold">
                              {t('quotes.materialUnitPriceHeader')}
                            </TableColumn>
                            <TableColumn className="text-right print:font-semibold">
                              {t('quotes.materialLineTotalHeader')}
                            </TableColumn>
                          </TableHeader>
                          <TableBody items={task.materials as MaterialItem[]}>
                            {(material) => (
                              <TableRow key={material.id}>
                                <TableCell>
                                  {material.productId || t('common.notAvailable')}
                                </TableCell>
                                <TableCell>{material.notes || '-'}</TableCell>
                                <TableCell className="text-right">{material.quantity}</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(material.unitPrice)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(material.quantity * material.unitPrice)}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  {task.materialType === 'itemized' &&
                    (!task.materials || task.materials.length === 0) && (
                      <p className="mt-1 pl-4 text-xs text-gray-500 italic print:pl-2">
                        {t('quotes.noMaterialsAdded')}
                      </p>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">{t('quotes.noTasksAddedReadOnly')}</p>
          )}
        </div>

        {quoteData.notes && (
          <div className="mb-8 print:mt-4">
            <h3 className="mb-2 text-lg font-bold text-gray-700 print:mt-3 print:border-t print:border-black print:pt-2 print:text-xl">
              Notes
            </h3>
            <div className="rounded-md bg-gray-50 p-4 print:bg-transparent print:p-0 print:text-sm">
              <p className="whitespace-pre-line">{quoteData.notes}</p>
            </div>
          </div>
        )}

        <div className="mb-8 print:mt-4">
          <h3 className="mb-2 text-lg font-bold text-gray-700 print:mt-3 print:border-t print:border-black print:pt-2 print:text-xl">
            Terms & Conditions
          </h3>
          <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-600 print:bg-transparent print:p-0 print:text-xs">
            <p className="mb-1 print:mb-0.5">
              <strong>1. Acceptance:</strong> This quote is valid for 30 days from the date of issue
              unless otherwise stated. Acceptance of this quote constitutes an agreement to the
              terms and conditions stated herein.
            </p>
            <p className="mb-1 print:mb-0.5">
              <strong>2. Payment:</strong> A 50% deposit is required to begin work, with the
              remaining balance due upon completion. All payments must be made within 15 days of
              invoice receipt.
            </p>
            <p className="mb-1 print:mb-0.5">
              <strong>3. Changes:</strong> Any changes to the scope of work may result in additional
              charges. Changes must be agreed upon in writing before implementation.
            </p>
            <p>
              <strong>4. Warranty:</strong> All work is guaranteed for a period of one year from the
              date of completion, covering defects in workmanship or materials.
            </p>
          </div>
        </div>

        {/* Signature Section - Adjust spacing for print */}
        <div className="mt-12 grid grid-cols-1 gap-8 border-t border-gray-300 pt-8 print:mt-8 print:grid-cols-2 print:gap-12 print:border-t-2 print:border-black print:pt-4">
          <div>
            <p className="mb-4 text-sm text-gray-600 print:mb-2 print:text-xs">
              To accept this quote, please sign and date below:
            </p>
            <div className="mb-4 border-b border-gray-300 pb-1 print:mb-6 print:pb-2">
              <p className="text-xs text-gray-500 print:text-sm">Customer Signature</p>
            </div>
            <div className="mb-4 border-b border-gray-300 pb-1 print:mb-6 print:pb-2">
              <p className="text-xs text-gray-500 print:text-sm">Date</p>
            </div>
            <div className="mb-2 border-b border-gray-300 pb-1 print:mb-4 print:pb-2">
              <p className="text-xs text-gray-500 print:text-sm">Print Name</p>
            </div>
          </div>
          <div>
            <p className="mb-4 text-sm text-gray-600 print:mb-2 print:text-xs">Approved by:</p>
            <div className="mb-4 border-b border-gray-300 pb-1 print:mb-6 print:pb-2">
              <p className="text-xs text-gray-500 print:text-sm">Company Representative</p>
            </div>
            <div className="mb-4 border-b border-gray-300 pb-1 print:mb-6 print:pb-2">
              <p className="text-xs text-gray-500 print:text-sm">Date</p>
            </div>
            <div className="mb-2 border-b border-gray-300 pb-1 print:mb-4 print:pb-2">
              <p className="text-xs text-gray-500 print:text-sm">Title</p>
            </div>
          </div>
        </div>

        {/* Footer - Simplify for print */}
        <div className="mt-12 border-t border-gray-300 pt-4 text-center text-sm text-gray-500 print:mt-6 print:border-t-2 print:border-black print:pt-2 print:text-xs">
          <p>Thank you for your business!</p>
          <p>For any questions regarding this quote, please contact us at (555) 123-4567.</p>
        </div>
      </div>
    </>
  );
};

// Assign the PrintLayout to the page
PrintQuotePage.getLayout = function getLayout(page: React.ReactElement) {
  return <PrintLayout>{page}</PrintLayout>;
};

export default PrintQuotePage;
