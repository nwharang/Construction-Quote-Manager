'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Button, Spinner, Switch, Input } from '@heroui/react';
import { Settings, X } from 'lucide-react';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import type { NextPageWithLayout } from '~/types/next';
import { PrintLayout } from '~/layouts/PrintLayout';
import { routes } from '~/config/routes';
import { useConfigStore } from '~/store/configStore';
import { APP_NAME } from '~/config/constants';
import { formatDate as formatDateUtil } from '~/utils/date';

const PRINT_SETTINGS_STORAGE_KEY = 'quotePrintSettings';

interface PrintSettings {
  showMarkupLineItem: boolean;
  showSignatureSection: boolean;
  showSeparatePrices: boolean;
  showPrintDate: boolean;
  signerName: string;
}

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
  // --- START: Moved all hooks to the top ---
  const router = useRouter();
  const { id: quoteId } = router.query;
  const { status } = useSession();
  const { formatCurrency, formatDate, t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [showMarkupLineItem, setShowMarkupLineItem] = useState(true);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [showSignatureSection, setShowSignatureSection] = useState(false);
  const [showSeparatePrices, setShowSeparatePrices] = useState(false);
  const [showPrintDate, setShowPrintDate] = useState(false);
  const [signerName, setSignerName] = useState('');
  const { settings } = useConfigStore();

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

  const getLaborTotal = useCallback(
    (tasks: Task[] = []) => {
      return tasks.reduce((total, task) => total + toNumber(task.price), 0);
    },
    [toNumber]
  );

  const formatPercent = useCallback(
    (value: number): string => {
      try {
        return new Intl.NumberFormat(settings?.locale || 'en', {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(value / 100);
      } catch (error) {
        return `${value}%`;
      }
    },
    [settings?.locale] // Corrected dependency: settings is an object, access specific property
  );

  useEffect(() => {
    setMounted(true);
    // Load settings from localStorage
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem(PRINT_SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        try {
          const parsedSettings: PrintSettings = JSON.parse(savedSettings);
          setShowMarkupLineItem(parsedSettings.showMarkupLineItem);
          setShowSignatureSection(parsedSettings.showSignatureSection);
          setShowSeparatePrices(parsedSettings.showSeparatePrices);
          setShowPrintDate(parsedSettings.showPrintDate);
          setSignerName(parsedSettings.signerName || '');
        } catch (error) {
          console.error('Error parsing print settings from localStorage:', error);
        }
      }
    }
  }, []); // Empty dependency array means this runs once on mount

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const currentSettings: PrintSettings = {
        showMarkupLineItem,
        showSignatureSection,
        showSeparatePrices,
        showPrintDate,
        signerName,
      };
      localStorage.setItem(PRINT_SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings));
    }
  }, [
    mounted,
    showMarkupLineItem,
    showSignatureSection,
    showSeparatePrices,
    showPrintDate,
    signerName,
  ]);

  // --- NEW useEffect for Auth Redirect ---
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);
  // --- END NEW useEffect ---

  // --- END: Moved all hooks to the top ---

  // Conditional returns remain after all hooks are called
  // Loading state
  if (!mounted || status === 'loading' || isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 print:hidden">
        <Spinner size="lg" />
      </div>
    );
  }

  // Authentication check (Remove router.push from here)
  if (status === 'unauthenticated') {
    // router.push('/auth/signin'); // Removed side effect from render
    return null; // Still return null to prevent rendering the page content
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

  // Dynamic title based on quote data
  const pageTitle = quote
    ? `${t('quotes.print.pageTitle')} #${quote.sequentialId || quote.id.substring(0, 6)} | ${APP_NAME}`
    : `Print Quote | ${APP_NAME}`;

  const handleToggleMarkupDisplay = () => {
    setShowMarkupLineItem(!showMarkupLineItem);
  };

  const toggleSettingsPanel = () => {
    setIsSettingsPanelOpen(!isSettingsPanelOpen);
  };

  const handleToggleSignatureSection = () => {
    setShowSignatureSection(!showSignatureSection);
  };

  const handleToggleSeparatePrices = () => {
    setShowSeparatePrices(!showSeparatePrices);
  };

  const handleTogglePrintDate = () => {
    setShowPrintDate(!showPrintDate);
  };

  const handleSignerNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSignerName(event.target.value);
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <style type="text/css" media="print">{`
          @page { 
            margin: 0.5in;
            /* Attempt to remove default browser header/footer */
            @top-center { content: none; }
            @bottom-center { content: none; }
            @top-left { content: none; }
            @top-right { content: none; }
            @bottom-left { content: none; }
            @bottom-right { content: none; }
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

      {/* Settings FAB - hidden on print */}
      <Button
        isIconOnly
        color="primary"
        variant="solid"
        className="fixed right-6 bottom-6 z-20 h-14 w-14 rounded-full shadow-lg print:hidden"
        onPress={toggleSettingsPanel}
        aria-label={t('quotes.print.printOptionsTitle')}
      >
        <Settings size={24} />
      </Button>

      {/* Print Options Panel - Fixed position, hidden on print, visibility controlled by className */}
      <div
        className={`fixed top-28 right-4 z-10 w-64 rounded-lg border bg-white p-4 shadow-lg transition-opacity duration-200 ease-in-out print:hidden ${isSettingsPanelOpen ? 'visible opacity-100' : 'invisible opacity-0'} `}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{t('quotes.print.printOptionsTitle')}</h3>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={toggleSettingsPanel}
            aria-label={t('common.close')}
          >
            <X size={18} />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            isSelected={showMarkupLineItem}
            onChange={handleToggleMarkupDisplay}
            aria-label={t('quotes.print.showingMarkupDetails')}
          />
          <span className="text-sm">
            {showMarkupLineItem
              ? t('quotes.print.showingMarkupDetails')
              : t('quotes.print.hidingMarkupDetails')}
          </span>
        </div>
        <div className="mt-3 flex items-center space-x-2">
          <Switch
            isSelected={showSignatureSection}
            onChange={handleToggleSignatureSection}
            aria-label={t('quotes.print.toggleSignatureSection')}
          />
          <span className="text-sm">
            {showSignatureSection
              ? t('quotes.print.showingSignatureSection')
              : t('quotes.print.hidingSignatureSection')}
          </span>
        </div>
        <div className="mt-3 flex items-center space-x-2">
          <Switch
            isSelected={showSeparatePrices}
            onChange={handleToggleSeparatePrices}
            aria-label={t('quotes.print.toggleSeparatePrices')}
          />
          <span className="text-sm">
            {showSeparatePrices
              ? t('quotes.print.showingSeparatePrices')
              : t('quotes.print.showingCombinedPrice')}
          </span>
        </div>
        <div className="mt-3 flex items-center space-x-2">
          <Switch
            isSelected={showPrintDate}
            onChange={handleTogglePrintDate}
            aria-label={t('quotes.print.togglePrintDate')}
          />
          <span className="text-sm">
            {showPrintDate ? t('quotes.print.showingPrintDate') : t('quotes.print.hidingPrintDate')}
          </span>
        </div>
        <div className="mt-3">
          <Input
            label={t('quotes.print.signerNameLabel')}
            placeholder={t('quotes.print.signerNamePlaceholder')}
            value={signerName}
            onChange={handleSignerNameChange}
            fullWidth
            size="sm"
            variant="bordered"
          />
        </div>
      </div>

      {quote && (
        <div className="print-page mx-auto max-w-full bg-white p-4 shadow sm:max-w-[8.5in] sm:p-6 print:max-w-none print:p-0 print:shadow-none">
          {/* Company Header */}
          <div className="mb-6 border-b border-gray-200 pb-4 sm:pb-6 print:border-b-gray-400">
            <div className="mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
                  {quote.title || `Quote #${quote.sequentialId}`}
                </h1>
                {showPrintDate && (
                  <p className="text-sm text-gray-600 sm:text-base">
                    {t('quotes.print.printDateLabel')}: {formatDate(new Date(), 'long')}
                  </p>
                )}
              </div>
              {(settings?.companyName ||
                settings?.companyEmail ||
                settings?.companyPhone ||
                settings?.companyAddress) && (
                <div className="text-left sm:text-right">
                  {settings?.companyName && (
                    <h2 className="text-lg font-semibold text-gray-800">{settings.companyName}</h2>
                  )}
                  {settings?.companyEmail && (
                    <p className="text-sm text-gray-600 sm:text-base">{settings.companyEmail}</p>
                  )}
                  {settings?.companyPhone && (
                    <p className="text-sm text-gray-600 sm:text-base">{settings.companyPhone}</p>
                  )}
                  {settings?.companyAddress && (
                    <p className="text-sm whitespace-pre-line text-gray-600 sm:text-base">
                      {settings.companyAddress}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Unified DL for consistent indentation */}
          <dl className="mb-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm sm:mb-8 sm:gap-y-2 sm:text-base">
            {/* Customer Information Items - This will now be the first section in the DL */}
            {quote.customer &&
              Object.keys(quote.customer).some(
                (key) =>
                  quote.customer &&
                  quote.customer[key as keyof typeof quote.customer] !== null &&
                  quote.customer[key as keyof typeof quote.customer] !== undefined &&
                  quote.customer[key as keyof typeof quote.customer] !== ''
              ) && (
                <>
                  {/* Separator/Header for Customer Info */}
                  <dt className="col-span-2 mb-1 border-b border-gray-200 pt-1 pb-1 text-lg font-semibold text-black sm:mb-2 print:border-gray-400">
                    {t('quotes.print.customer')}
                  </dt>
                  {quote.customer.name && (
                    <>
                      <dt className="font-medium text-black">{t('customers.list.name')}</dt>
                      <dd className="text-black">{quote.customer.name}</dd>
                    </>
                  )}
                  {quote.customer.phone && (
                    <>
                      <dt className="font-medium text-black">{t('customers.list.phone')}</dt>
                      <dd className="text-black">{quote.customer.phone}</dd>
                    </>
                  )}
                  {quote.customer.email && (
                    <>
                      <dt className="font-medium text-black">{t('customers.list.email')}</dt>
                      <dd className="text-black">{quote.customer.email}</dd>
                    </>
                  )}
                  {quote.customer.address && (
                    <>
                      <dt className="font-medium text-black">{t('customers.list.address')}</dt>
                      <dd className="whitespace-pre-line text-black">{quote.customer.address}</dd>
                    </>
                  )}
                </>
              )}
          </dl>

          {quote.notes && (
            <div className="mb-6 sm:mb-8">
              <h2 className="mb-2 border-b border-gray-200 pb-1 text-lg font-semibold text-gray-800 sm:mb-3 print:border-gray-400">
                {t('quotes.print.notes')}
              </h2>
              <p className="text-sm whitespace-pre-wrap text-gray-700 sm:text-base">
                {quote.notes}
              </p>
            </div>
          )}

          {quote.tasks && quote.tasks.length > 0 && (
            <div className="">
              <h2 className="mb-2 border-b border-gray-200 pb-1 text-lg font-semibold text-gray-800 sm:mb-3 print:border-gray-400">
                {t('quotes.print.tasksAndMaterials')}
              </h2>
              <div className="-mx-4 overflow-x-auto sm:mx-0">
                <table className="w-full min-w-full table-fixed border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-400 bg-gray-200 print:bg-gray-200">
                      <th className="w-12 p-2 text-center text-sm font-semibold whitespace-normal text-gray-700 sm:p-3 sm:text-base">
                        #
                      </th>
                      <th className="p-2 text-left text-sm font-semibold whitespace-normal text-gray-700 sm:p-3 sm:text-base">
                        {t('quotes.print.description')}
                      </th>
                      {showSeparatePrices ? (
                        <>
                          <th className="p-2 text-right text-sm font-semibold whitespace-normal text-gray-700 sm:p-3 sm:text-base">
                            {t('quotes.print.labor')}
                          </th>
                          <th className="p-2 text-right text-sm font-semibold whitespace-normal text-gray-700 sm:p-3 sm:text-base">
                            {t('quotes.print.materials')}
                          </th>
                          <th className="p-2 text-right text-sm font-semibold whitespace-normal text-gray-700 sm:p-3 sm:text-base">
                            {t('quotes.print.subtotal')}
                          </th>
                        </>
                      ) : (
                        <th className="p-2 text-right text-sm font-semibold whitespace-normal text-gray-700 sm:p-3 sm:text-base">
                          {t('quotes.print.combinedPriceHeader')} {/* Combined total header */}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {quote.tasks.map((task, index) => {
                      const taskPriceRaw = toNumber(task.price);
                      const taskMaterialsTotalRaw =
                        task.materialType === 'LUMPSUM'
                          ? toNumber(task.estimatedMaterialsCostLumpSum)
                          : task.materials?.reduce(
                              (sum, mat) => sum + toNumber(mat.quantity) * toNumber(mat.unitPrice),
                              0
                            ) || 0;

                      // Determine if markup should be displayed transparently or distributed
                      // Based on the showMarkupLineItem state
                      const displayMarkupTransparently = showMarkupLineItem;
                      const markupRate = 1 + toNumber(quote?.markupPercentage || 0); // e.g., 1.05 for 5% markup

                      let priceForDisplay = taskPriceRaw;
                      let materialsTotalForDisplay = taskMaterialsTotalRaw;

                      if (!displayMarkupTransparently && toNumber(quote.markupPercentage) > 0) {
                        // Distribute markup into item prices
                        priceForDisplay = taskPriceRaw * markupRate;
                        materialsTotalForDisplay = taskMaterialsTotalRaw * markupRate;
                      }

                      const taskSubtotalForDisplay = priceForDisplay + materialsTotalForDisplay;

                      return (
                        <tr
                          key={task.id}
                          className="border-b border-gray-200 hover:bg-gray-50 print:cursor-default print:border-gray-400 print:hover:bg-transparent"
                        >
                          <td className="w-12 p-2 text-center text-sm text-gray-700 sm:p-3 sm:text-base">
                            {index + 1}
                          </td>
                          <td className="p-2 text-sm whitespace-normal text-gray-700 sm:p-3 sm:text-base">
                            {task.description}
                          </td>
                          {showSeparatePrices ? (
                            <>
                              <td className="p-2 text-right text-sm whitespace-normal text-gray-700 sm:p-3 sm:text-base">
                                <span className="currency-value">
                                  {formatCurrency(priceForDisplay)}
                                </span>
                              </td>
                              <td className="p-2 text-right text-sm whitespace-normal text-gray-700 sm:p-3 sm:text-base">
                                <span className="currency-value">
                                  {formatCurrency(materialsTotalForDisplay)}
                                </span>
                              </td>
                              <td className="p-2 text-right text-sm font-medium whitespace-normal text-gray-700 sm:p-3 sm:text-base">
                                <span className="currency-value">
                                  {formatCurrency(taskSubtotalForDisplay)}
                                </span>
                              </td>
                            </>
                          ) : (
                            <td className="p-2 text-right text-sm font-medium whitespace-normal text-gray-700 sm:p-3 sm:text-base">
                              <span className="currency-value">
                                {formatCurrency(taskSubtotalForDisplay)}
                              </span>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* New Dedicated Summary Section - Wrapped for right alignment */}
          {quote.tasks && quote.tasks.length > 0 && (
            <div className="flex justify-end border-t border-gray-300 pt-4 print:border-gray-400">
              <dl className="space-y-1 text-sm text-gray-700 sm:space-y-2">
                {/* Conditionally display subtotal and markup amount based on showMarkupLineItem state */}
                {showMarkupLineItem && toNumber(quote.markupPercentage) > 0 && (
                  <div className="flex justify-between">
                    <dt>{t('quotes.print.subtotal')}</dt>
                    <dd className="currency-value font-medium">{formatCurrency(subtotal)}</dd>
                  </div>
                )}
                {showMarkupLineItem && toNumber(quote.markupPercentage) > 0 && (
                  <div className="flex justify-between">
                    <dt>{t('quotes.markupPercentageLabel')}</dt>
                    <dd className="currency-value font-medium">
                      {formatPercent(toNumber(quote.markupPercentage) * 100)}
                    </dd>
                  </div>
                )}
                {showMarkupLineItem && toNumber(quote.markupPercentage) > 0 && (
                  <div className="flex justify-between">
                    <dt>{t('quotes.print.markupAmount')}</dt>
                    <dd className="currency-value font-medium">{formatCurrency(markupAmount)}</dd>
                  </div>
                )}

                <div className="flex justify-between border-t border-gray-200 pt-1 text-base font-bold text-black sm:pt-2 print:border-gray-400">
                  <dt>{t('quotes.print.grandTotal')}</dt>
                  <dd className="currency-value ml-8">{formatCurrency(grandTotal)}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Signature Section - Conditionally Rendered */}
          {showSignatureSection && (
            <div className="mt-4 print:border-gray-400">
              <div className="flex pt-4">
                <div className="flex-1"></div>
                <div className="flex-1"></div>
                <div className="flex flex-1 flex-col">
                  <p className="text-sm">
                    {/* full date month year in current locale */}
                    {formatDateUtil(new Date(), 'full')}
                  </p>
                  <p className="font-semibold mt-2">
                    {/* Display signerName if provided, otherwise the default "Authorized Signature" label */}
                    {signerName || t('quotes.print.signatureAuthorizedLabel')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {/* Always display the "Name (Printed)" label */}(
                    {t('quotes.print.signatureNamePrintedLabel')})
                  </p>
                </div>
              </div>
            </div>
          )}

          <footer className="mt-8 pt-4 text-center text-xs text-gray-500">
            {/* 
            <p>
              {t('quotes.print.generatedMessage', {
                date: formatDate(new Date(), 'long'),
              })}
            </p>
            */}
          </footer>
        </div>
      )}

      {/* Task Detail Drawer - Only visible on screen */}
    </>
  );
};

PrintQuotePage.getLayout = function getLayout(page: React.ReactElement) {
  return <PrintLayout title="Quote Print">{page}</PrintLayout>;
};

export default PrintQuotePage;
