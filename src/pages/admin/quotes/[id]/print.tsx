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

  const formatPercent = useCallback((value: number) => {
    return `${value.toFixed(2)}%`;
  }, []);

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
        <title>{quote ? `Quote #${quote.sequentialId}` : 'Quote Print'}</title>
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
          
          /* Hide elements with print:hidden class */
          .print\\:hidden {
            display: none !important;
          }
        `}</style>
      </Head>

      {quote && (
        <div className="print-page mx-auto max-w-[8.5in] bg-white p-6 shadow print:max-w-none print:p-0 print:shadow-none">
          {/* Company Header */}
          <div className="mb-6 border-b border-gray-200 pb-6 print:border-b-gray-400">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {quote.title || `Quote #${quote.sequentialId}`}
                </h1>
                <p className="text-gray-600">{formatDate(quote.createdAt)}</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-semibold text-gray-800">{settings?.companyName}</h2>
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h2 className="mb-3 border-b border-gray-200 pb-1 text-lg font-semibold text-gray-800">
                Quote Information
              </h2>
              <div className="space-y-2">
                {quote.title && (
                  <p>
                    <span className="font-medium text-black">Title:</span>{' '}
                    <span className="text-black">{quote.title}</span>
                  </p>
                )}
                {toNumber(quote.markupPercentage) > 0 && (
                  <p>
                    <span className="font-medium text-black">Markup:</span>{' '}
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
                <div>
                  <h2 className="mb-3 border-b border-gray-200 pb-1 text-lg font-semibold text-gray-800">
                    Customer Information
                  </h2>
                  <div className="space-y-2">
                    {quote.customer.name && (
                      <p>
                        <span className="font-medium text-black">Name:</span>{' '}
                        <span className="text-black">{quote.customer.name}</span>
                      </p>
                    )}
                    {quote.customer.phone && (
                      <p>
                        <span className="font-medium text-black">Phone:</span>{' '}
                        <span className="text-black">{quote.customer.phone}</span>
                      </p>
                    )}
                    {quote.customer.email && (
                      <p>
                        <span className="font-medium text-black">Email:</span>{' '}
                        <span className="text-black">{quote.customer.email}</span>
                      </p>
                    )}
                    {quote.customer.address && (
                      <p>
                        <span className="font-medium text-black">Address:</span>{' '}
                        <span className="text-black">{quote.customer.address}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
          </div>

          {quote.tasks && quote.tasks.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 border-b border-gray-200 pb-1 text-lg font-semibold text-gray-800">
                Tasks & Materials
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-400 bg-gray-200 print:bg-gray-200">
                      <th className="p-3 text-left font-semibold text-gray-700">Description</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Labor</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Materials</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Subtotal</th>
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
                          <td className="p-3 text-gray-700">{task.description}</td>
                          <td className="p-3 text-right text-gray-700">
                            {formatCurrency(toNumber(task.price))}
                          </td>
                          <td className="p-3 text-right text-gray-700">
                            {formatCurrency(taskMaterialsTotal)}
                          </td>
                          <td className="p-3 text-right font-medium text-gray-700">
                            {formatCurrency(taskTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-400 bg-gray-200 print:bg-gray-200">
                      <td className="p-3 text-left font-medium text-gray-800">Summary</td>
                      <td className="p-3 text-right font-medium text-gray-800">
                        {formatCurrency(laborTotal)}
                      </td>
                      <td className="p-3 text-right font-medium text-gray-800">
                        {formatCurrency(materialsTotal)}
                      </td>
                      <td className="p-3 text-right font-bold text-black">
                        {formatCurrency(grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {quote.notes && (
            <div className="mb-8">
              <h2 className="mb-3 border-b border-gray-200 pb-1 text-lg font-semibold text-gray-800">
                Notes
              </h2>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 print:bg-gray-50">
                <p className="whitespace-pre-wrap text-gray-700">{quote.notes}</p>
              </div>
            </div>
          )}

          <div className="mt-12 text-center text-xs text-gray-500 print:hidden">
            <p>
              This document was generated on {new Date().toLocaleDateString()} and is for estimation
              purposes only.
            </p>
          </div>
        </div>
      )}

      {/* Render the drawer component */}
    </>
  );
};

PrintQuotePage.getLayout = function getLayout(page: React.ReactElement) {
  return <PrintLayout title="Quote Print">{page}</PrintLayout>;
};

export default PrintQuotePage;
