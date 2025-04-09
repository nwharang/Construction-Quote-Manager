'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Button, Spinner, Drawer } from '@heroui/react';
import { X } from 'lucide-react';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import type { NextPageWithLayout } from '~/types/next';
import { PrintLayout } from '~/layouts/PrintLayout';
import { routes } from '~/config/routes';
import { useConfigStore } from '~/store/configStore';

// Task type definitions
interface Material {
  id?: string;
  quantity: string | number;
  unitPrice: string | number;
  productName?: string | null;
  [key: string]: unknown;
}

interface Task {
  id: string;
  description: string;
  price: string | number;
  materialType: 'LUMPSUM' | 'ITEMIZED';
  estimatedMaterialsCostLumpSum: string | number | null;
  materials?: Material[];
  [key: string]: unknown;
}

const PrintQuotePage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: quoteId } = router.query;
  const { status } = useSession();
  const { formatCurrency, formatDate, t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Get company info from config store
  const { settings } = useConfigStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: fetchedQuoteData, isLoading } = api.quote.getById.useQuery(
    { id: typeof quoteId === 'string' ? quoteId : '' },
    {
      enabled: typeof quoteId === 'string' && status === 'authenticated',
      refetchOnWindowFocus: false,
    }
  );

  const toNumber = useCallback((value: string | number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  const getLaborTotal = useCallback(
    (tasks: Task[] = []) => {
      return tasks.reduce((total, task) => total + toNumber(task.price), 0);
    },
    [toNumber]
  );

  const getMaterialsTotal = useCallback(
    (tasks: Task[] = []) => {
      return tasks.reduce((total, task) => {
        if (task.materialType === 'LUMPSUM') {
          return total + toNumber(task.estimatedMaterialsCostLumpSum);
        } else if (task.materialType === 'ITEMIZED' && task.materials) {
          return (
            total +
            task.materials.reduce(
              (subtotal: number, material: Material) =>
                subtotal + toNumber(material.quantity) * toNumber(material.unitPrice),
              0
            )
          );
        }
        return total;
      }, 0);
    },
    [toNumber]
  );

  const formatPercent = useCallback((value: number): string => {
    try {
      return new Intl.NumberFormat(settings?.locale || 'en', {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value / 100);
    } catch (error) {
      return `${value}%`;
    }
  }, [settings]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  // Loading state
  if (!mounted || status === 'loading' || isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 print:hidden">
        <Spinner size="lg" />
      </div>
    );
  }

  // Authentication check
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Not found state
  if (!isLoading && !fetchedQuoteData) {
    return (
      <div className="container mx-auto p-4 print:hidden">
        <div className="py-12 text-center">
          <h2 className="mb-4 text-2xl font-bold">Quote Not Found</h2>
          <p className="mb-6 text-gray-500">
            The quote you're looking for doesn't exist or has been removed.
          </p>
          <Button color="primary" onPress={() => router.push(routes.admin.quotes.list)}>
            Back to Quotes
          </Button>
        </div>
      </div>
    );
  }

  const quote = fetchedQuoteData;

  // Calculate totals
  const laborTotal = getLaborTotal(quote?.tasks || []);
  const materialsTotal = getMaterialsTotal(quote?.tasks || []);
  const subtotal = laborTotal + materialsTotal;
  const markupAmount = subtotal * toNumber(quote?.markupPercentage || 0);
  const grandTotal = subtotal + markupAmount;

  return (
    <>
      <Head>
        <title>{quote?.title ? `${quote.title} - Print` : 'Quote Print'}</title>
        <style type="text/css" media="print">{`
          @page { 
            size: letter portrait;
            margin: 0.5in; 
          }
          body { 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            background-color: white !important;
          }
          .print-page {
            page-break-inside: avoid;
            background-color: white !important;
          }
          .page-break { 
            page-break-after: always; 
            height: 0;
            display: block;
          }
          tr { page-break-inside: avoid; }
          .hover-effect:hover { background-color: transparent !important; }
          
          /* Ensure currency values have consistent alignment and spacing */
          .currency-value {
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
          }
          
          /* Hide elements with print:hidden class */
          .print\\:hidden {
            display: none !important;
          }
        `}</style>
      </Head>

      {quote && (
        <div className="print-page mx-auto max-w-full sm:max-w-[8.5in] bg-white p-4 sm:p-6 shadow print:max-w-none print:p-0 print:shadow-none">
          {/* Company Header */}
          <div className="mb-6 border-b border-gray-200 pb-4 sm:pb-6 print:border-b-gray-400">
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {quote.title || `Quote #${quote.sequentialId}`}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">{formatDate(quote.createdAt, 'long')}</p>
              </div>
              <div className="text-left sm:text-right">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">{settings?.companyName || 'Company Name'}</h2>
                {settings?.companyEmail && <p className="text-sm sm:text-base text-gray-600">{settings.companyEmail}</p>}
                {settings?.companyPhone && <p className="text-sm sm:text-base text-gray-600">{settings.companyPhone}</p>}
                {settings?.companyAddress && <p className="text-sm sm:text-base text-gray-600 whitespace-pre-line">{settings.companyAddress}</p>}
              </div>
            </div>
          </div>

          <div className="mb-6 sm:mb-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            <div className="order-1 md:order-1">
              <h2 className="mb-2 sm:mb-3 border-b border-gray-200 pb-1 text-base sm:text-lg font-semibold text-gray-800">
                {t('quotes.print.quoteInformation')}
              </h2>
              <div className="space-y-1 sm:space-y-2">
                {quote.title && (
                  <p className="text-sm sm:text-base">
                    <span className="font-medium text-black">{t('quotes.print.title')}</span>{' '}
                    <span className="text-black">{quote.title}</span>
                  </p>
                )}
                {toNumber(quote.markupPercentage) > 0 && (
                  <p className="text-sm sm:text-base">
                    <span className="font-medium text-black">{t('quotes.print.markup', { percentage: toNumber(quote.markupPercentage) * 100 })}</span>{' '}
                    <span className="text-black">
                      {formatPercent(toNumber(quote.markupPercentage) * 100)}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {quote.customer &&
              Object.keys(quote.customer).some(
                (key) =>
                  quote.customer &&
                  quote.customer[key as keyof typeof quote.customer] !== null &&
                  quote.customer[key as keyof typeof quote.customer] !== undefined &&
                  quote.customer[key as keyof typeof quote.customer] !== ''
              ) && (
                <div className="order-2 md:order-2">
                  <h2 className="mb-2 sm:mb-3 border-b border-gray-200 pb-1 text-base sm:text-lg font-semibold text-gray-800">
                    {t('quotes.print.customer')}
                  </h2>
                  <div className="space-y-1 sm:space-y-2">
                    {quote.customer.name && (
                      <p className="text-sm sm:text-base">
                        <span className="font-medium text-black">{t('customers.list.name')}:</span>{' '}
                        <span className="text-black">{quote.customer.name}</span>
                      </p>
                    )}
                    {quote.customer.phone && (
                      <p className="text-sm sm:text-base">
                        <span className="font-medium text-black">{t('customers.list.phone')}:</span>{' '}
                        <span className="text-black">{quote.customer.phone}</span>
                      </p>
                    )}
                    {quote.customer.email && (
                      <p className="text-sm sm:text-base">
                        <span className="font-medium text-black">{t('customers.list.email')}:</span>{' '}
                        <span className="text-black">{quote.customer.email}</span>
                      </p>
                    )}
                    {quote.customer.address && (
                      <p className="text-sm sm:text-base">
                        <span className="font-medium text-black">{t('customers.list.address')}:</span>{' '}
                        <span className="text-black">{quote.customer.address}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
          </div>

          {quote.tasks && quote.tasks.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="mb-2 sm:mb-3 border-b border-gray-200 pb-1 text-base sm:text-lg font-semibold text-gray-800">
                {t('quotes.print.tasksAndMaterials')}
              </h2>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full border-collapse min-w-full table-auto">
                  <thead>
                    <tr className="border-b-2 border-gray-400 bg-gray-200 print:bg-gray-200">
                      <th className="p-2 sm:p-3 text-left text-sm sm:text-base font-semibold text-gray-700">{t('quotes.print.description')}</th>
                      <th className="p-2 sm:p-3 text-right text-sm sm:text-base font-semibold text-gray-700">{t('quotes.print.labor')}</th>
                      <th className="p-2 sm:p-3 text-right text-sm sm:text-base font-semibold text-gray-700">{t('quotes.print.materials')}</th>
                      <th className="p-2 sm:p-3 text-right text-sm sm:text-base font-semibold text-gray-700">{t('quotes.print.subtotal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.tasks.map((task) => {
                      const taskMaterialsTotal =
                        task.materialType === 'LUMPSUM'
                          ? toNumber(task.estimatedMaterialsCostLumpSum)
                          : task.materials?.reduce(
                              (sum, mat) => sum + toNumber(mat.quantity) * toNumber(mat.unitPrice),
                              0
                            ) || 0;

                      const taskTotal = toNumber(task.price) + taskMaterialsTotal;

                      return (
                        <tr
                          key={task.id}
                          className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 print:cursor-default print:hover:bg-transparent"
                          onClick={() => handleTaskClick(task as Task)}
                        >
                          <td className="p-2 sm:p-3 text-sm sm:text-base text-gray-700">{task.description}</td>
                          <td className="p-2 sm:p-3 text-sm sm:text-base text-right text-gray-700">
                            <span className="currency-value">{formatCurrency(toNumber(task.price))}</span>
                          </td>
                          <td className="p-2 sm:p-3 text-sm sm:text-base text-right text-gray-700">
                            <span className="currency-value">{formatCurrency(taskMaterialsTotal)}</span>
                          </td>
                          <td className="p-2 sm:p-3 text-sm sm:text-base text-right font-medium text-gray-700">
                            <span className="currency-value">{formatCurrency(taskTotal)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-400 bg-gray-200 print:bg-gray-200">
                      <td className="p-2 sm:p-3 text-sm sm:text-base text-left font-medium text-gray-800">{t('quotes.print.summary')}</td>
                      <td className="p-2 sm:p-3 text-sm sm:text-base text-right font-medium text-gray-800">
                        <span className="currency-value">{formatCurrency(laborTotal)}</span>
                      </td>
                      <td className="p-2 sm:p-3 text-sm sm:text-base text-right font-medium text-gray-800">
                        <span className="currency-value">{formatCurrency(materialsTotal)}</span>
                      </td>
                      <td className="p-2 sm:p-3 text-sm sm:text-base text-right font-bold text-black">
                        <span className="currency-value">{formatCurrency(grandTotal)}</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {quote.notes && (
            <div className="mb-6 sm:mb-8">
              <h2 className="mb-2 sm:mb-3 border-b border-gray-200 pb-1 text-base sm:text-lg font-semibold text-gray-800">
                {t('quotes.print.notes')}
              </h2>
              <div className="rounded border border-gray-200 bg-gray-50 p-2 sm:p-3 print:bg-gray-50">
                <p className="whitespace-pre-wrap text-sm sm:text-base text-gray-700">{quote.notes}</p>
              </div>
            </div>
          )}

          <div className="mt-8 sm:mt-12 text-center text-xs text-gray-500 print:hidden">
            <p>
              {t('quotes.print.generatedMessage', { date: formatDate(new Date(), 'long') })}
            </p>
          </div>
        </div>
      )}

      {/* Task Detail Drawer - Only visible on screen */}
      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={handleCloseDrawer}
        placement="right"
        size="sm"
        className="print:hidden"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('quotes.print.description')}</h3>
            <Button 
              variant="light" 
              isIconOnly 
              onPress={handleCloseDrawer}
              aria-label={t('common.close')}
            >
              <X size={20} />
            </Button>
          </div>
          
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">{t('quotes.taskDescriptionLabel')}</h4>
                <p>{selectedTask.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">{t('quotes.taskPriceLabel')}</h4>
                <p className="currency-value">{formatCurrency(toNumber(selectedTask.price))}</p>
              </div>
              
              {selectedTask.materialType === 'LUMPSUM' ? (
                <div>
                  <h4 className="font-medium mb-1">{t('quotes.materialTypeLabel')} ({t('quotes.materialTypeLumpSum')})</h4>
                  <p className="currency-value">
                    {formatCurrency(toNumber(selectedTask.estimatedMaterialsCostLumpSum))}
                  </p>
                </div>
              ) : selectedTask.materials && selectedTask.materials.length > 0 ? (
                <div>
                  <h4 className="font-medium mb-2">{t('quotes.materialTypeLabel')} ({t('quotes.materialTypeItemized')})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left">{t('productFields.name')}</th>
                          <th className="py-2 text-right">{t('productFields.unitPrice')}</th>
                          <th className="py-2 text-right">{t('quotes.print.subtotal')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTask.materials.map((material, index) => (
                          <tr key={material.id || index} className="border-b">
                            <td className="py-2 text-left">{material.productName || '-'}</td>
                            <td className="py-2 text-right">
                              {formatCurrency(toNumber(material.unitPrice))} × {material.quantity}
                            </td>
                            <td className="py-2 text-right">
                              {formatCurrency(toNumber(material.quantity) * toNumber(material.unitPrice))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
};

PrintQuotePage.getLayout = function getLayout(page: React.ReactElement) {
  return <PrintLayout title="Quote Print">{page}</PrintLayout>;
};

export default PrintQuotePage;
