import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Button, Card, Navbar, NavbarBrand, NavbarContent, Link } from '@heroui/react';
import { Printer, ArrowLeft } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';

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
  const router = useRouter();
  const pageTitle = title || t('print.document');

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="print-layout min-h-screen bg-gray-50 print:bg-white">
      <Head>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css" media="print">{`
          @page { 
            size: letter portrait;
            margin: 0.5in; 
          }
          body { 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        `}</style>
      </Head>

      {/* Header - only visible on screen */}
      <Navbar className="print:hidden border-b">
        <NavbarBrand>
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
        </NavbarBrand>
        <NavbarContent justify="end">
          <Button 
            color="primary" 
            startContent={<Printer size={18} />}
            onPress={handlePrint}
          >
            {t('print.printNow')}
          </Button>
          <Button 
            variant="light" 
            className="ml-2" 
            startContent={<ArrowLeft size={18} />}
            onPress={handleBack}
          >
            {t('common.back')}
          </Button>
        </NavbarContent>
      </Navbar>

      {/* Main content area */}
      <main className="container mx-auto p-4 md:px-8 print:p-0 print:max-w-none">
        {children}
      </main>
    </div>
  );
}

// Set display name for debugging
PrintLayout.displayName = 'PrintLayout';
