import React from 'react';
import Head from 'next/head';
import { useTranslation } from '~/utils/i18n';

interface PrintLayoutProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * Print-optimized layout with minimal styling
 * Removes navigation elements and other UI for clean printing
 */
export function PrintLayout({ children, title }: PrintLayoutProps) {
  const { t } = useTranslation();
  const pageTitle = title || t('print.document');

  return (
    <div className="print-layout min-h-screen bg-white">
      <Head>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="print-header flex items-center justify-between border-b p-4 print:hidden">
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
        <div className="print-controls">
          <button
            onClick={() => window.print()}
            className="bg-primary hover:bg-primary-dark rounded-md px-4 py-2 text-white transition-colors"
          >
            {t('print.printNow')}
          </button>
          <button
            onClick={() => window.history.back()}
            className="ml-2 rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
          >
            {t('common.back')}
          </button>
        </div>
      </div>

      <main className="p-4 md:p-8 print:p-0">{children}</main>

      <div className="print-footer p-4 text-center text-sm text-gray-500 print:hidden">
        <p>{t('print.generatedOn', { date: new Date().toLocaleDateString() })}</p>
      </div>
    </div>
  );
}

// Set display name for debugging
PrintLayout.displayName = 'PrintLayout';

export default PrintLayout;
