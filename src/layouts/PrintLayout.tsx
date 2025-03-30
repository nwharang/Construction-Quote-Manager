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
    <div className="print-layout bg-white min-h-screen">
      <Head>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div className="print-header p-4 flex justify-between items-center border-b print:hidden">
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
        <div className="print-controls">
          <button 
            onClick={() => window.print()}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            {t('print.printNow')}
          </button>
          <button 
            onClick={() => window.history.back()}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md ml-2 hover:bg-gray-300 transition-colors"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
      
      <main className="p-4 md:p-8 print:p-0">{children}</main>
      
      <div className="print-footer text-center p-4 text-gray-500 text-sm print:hidden">
        <p>{t('print.generatedOn', { date: new Date().toLocaleDateString() })}</p>
      </div>
    </div>
  );
}

// Set display name for debugging
PrintLayout.displayName = 'PrintLayout';

export default PrintLayout; 