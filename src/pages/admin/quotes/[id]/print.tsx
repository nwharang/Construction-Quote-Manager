'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Spinner, Button } from '@heroui/react';
import { useTranslation } from '~/hooks/useTranslation';
import { api } from '~/utils/api';
import { Printer, FileDown } from 'lucide-react';
import styles from './print.module.css';
import Script from 'next/script';
import type { Material, Task } from '~/types/quote';
import { useToastStore } from '~/store';

// Function to dynamically load jsPDF - placed outside of component to avoid re-creation
const loadJsPDF = async () => {
  try {
    // Dynamically import the libraries only when needed
    const jspdfModule = await import('jspdf');
    const html2canvasModule = await import('html2canvas');
    return {
      jsPDF: jspdfModule.default,
      html2canvas: html2canvasModule.default,
    };
  } catch (error) {
    console.error('Failed to load PDF libraries:', error);
    return null;
  }
};

// This will be our standalone print template
export default function QuotePrintPage() {
  const router = useRouter();
  const { id } = router.query;
  const { status } = useSession();
  const { formatCurrency, formatDate } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToastStore();

  // State for quote data
  const [quote, setQuote] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Fetch a quote by ID
  const fetchQuoteById = useCallback(async (quoteId: string) => {
    try {
      setLoading(true);
      const response = await api.quote.getById.useQuery({ id: quoteId }).data;
      
      if (response) {
        setQuote(response);
        
        // Populate tasks if available
        if (response.tasks && Array.isArray(response.tasks)) {
          setTasks(response.tasks);
        }
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      toast.error('Failed to load quote');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch quote data when component mounts - using a ref to prevent re-renders
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Only fetch if we have an ID, we're authenticated, and we haven't already fetched
    if (id && typeof id === 'string' && status === 'authenticated' && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchQuoteById(id);
    }
    // Include bare minimum dependencies
  }, [id, status, fetchQuoteById]);

  // Set mounted state - keep this separate from data fetching
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get customer details with a stable dependency
  const customerId = quote?.customerId || '';
  const { data: customerData } = api.customer.getById.useQuery(
    { id: customerId },
    {
      enabled: !!customerId && status === 'authenticated',
      refetchOnWindowFocus: false,
    }
  );

  // Determine customer info from either the customer record or the quote
  const customerInfo = customerData || {
    name: quote?.customerName || '',
    email: quote?.customerEmail || '',
    phone: quote?.customerPhone || '',
    address: quote?.customerAddress || '',
  };

  // Get status display name
  const getStatusDisplay = (status: string): string => {
    const statusMap: Record<string, string> = {
      draft: 'Draft',
      sent: 'Sent',
      accepted: 'Accepted',
      rejected: 'Rejected',
    };
    return statusMap[status.toLowerCase()] || status;
  };

  // Handle print button click
  const handlePrint = () => {
    window.print();
  };

  // Handle export to PDF with fixed types and variable declarations
  const handleExportPDF = async () => {
    if (!quote) return;

    try {
      setExporting(true);

      // Dynamically load jsPDF and html2canvas
      const pdfModules = await loadJsPDF();

      // Check if modules were loaded successfully
      if (!pdfModules) {
        throw new Error('PDF libraries could not be loaded');
      }

      const { jsPDF, html2canvas } = pdfModules;

      // Get the content element with proper type casting
      const contentElement = document.querySelector(`.${styles.container}`) as HTMLElement;
      if (!contentElement) {
        throw new Error('Print content not found');
      }

      // Create canvas from the content
      const canvas = await html2canvas(contentElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      // Create PDF with A4 dimensions
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate aspect ratio to fit the content to page
      const imageWidth = canvas.width;
      const imageHeight = canvas.height;
      const aspectRatio = Math.min(pdfWidth / imageWidth, pdfHeight / imageHeight);
      const xPosition = (pdfWidth - imageWidth * aspectRatio) / 2;
      const yPosition = 0;

      // Generate image data
      const imageData = canvas.toDataURL('image/jpeg', 1.0);

      // Add the image to the PDF
      pdf.addImage(
        imageData,
        'JPEG',
        xPosition,
        yPosition,
        imageWidth * aspectRatio,
        imageHeight * aspectRatio
      );

      // Generate a filename and save the PDF
      const filename = `quote-${quote.sequentialId || quote.id}-${quote.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  // Helper function to get task total
  const getTaskTotal = (task: Task): number => {
    let taskTotal = parseFloat(task.price.toString());

    // Add materials cost
    if (task.materialType === 'lumpsum') {
      taskTotal += task.estimatedMaterialsCostLumpSum || 0;
    } else {
      taskTotal += task.materials.reduce((sum: number, material: Material) => {
        return sum + material.quantity * material.unitPrice;
      }, 0);
    }

    return taskTotal;
  };

  // Renders a single task row for the quote
  const renderTaskRow = (task: Task, index: number) => {
    const taskTotal = getTaskTotal(task);
    
    return (
      <tr key={task.id} className="border-b">
        <td className="p-4">{index + 1}</td>
        <td className="p-4">{task.description}</td>
        <td className="p-4 text-right">{formatCurrency(taskTotal)}</td>
      </tr>
    );
  };

  // Loading state
  if (!mounted || status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
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
          <p className="mb-6">The quote you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.printbody}>
      <Head>
        <title>
          Quote #{quote.sequentialId || quote.id}: {quote.title}
        </title>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
          async
        ></Script>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
          async
        ></Script>
      </Head>

      {/* Action buttons (only visible on screen) */}
      <div className={styles.actionsBar}>
        <Button color="primary" startContent={<Printer size={18} />} onClick={handlePrint}>
          Print Document
        </Button>
        <Button
          color="secondary"
          startContent={<FileDown size={18} />}
          onClick={handleExportPDF}
          isLoading={exporting}
          disabled={exporting}
        >
          Save as PDF
        </Button>
      </div>

      {/* Printable content */}
      <div className={styles.container} id="quote-printable">
        {/* Header with company info and quote details */}
        <div className={styles.header}>
          <div className={styles.companyInfo}>
            <h2>Construction Quote Manager</h2>
            <p>123 Builder Avenue</p>
            <p>Construction City, ST 12345</p>
            <p>Phone: (555) 123-4567</p>
          </div>
          <div className={styles.quoteInfo}>
            <h1>QUOTE</h1>
            <table>
              <tbody>
                <tr>
                  <td className={styles.label}>Quote #:</td>
                  <td>{quote.sequentialId || quote.id}</td>
                </tr>
                <tr>
                  <td className={styles.label}>Date:</td>
                  <td>{formatDate(quote.createdAt)}</td>
                </tr>
                <tr>
                  <td className={styles.label}>Valid Until:</td>
                  <td>{quote.validUntil ? formatDate(quote.validUntil) : '30 days from issue'}</td>
                </tr>
                <tr>
                  <td className={styles.label}>Status:</td>
                  <td>{getStatusDisplay(quote.status)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Title and customer info */}
        <div className={styles.titleSection}>
          <h2 className={styles.quoteTitle}>{quote.title}</h2>
        </div>

        <div className={styles.customerSection}>
          <div className={styles.sectionTitle}>Customer Information</div>
          <div className={styles.customerDetails}>
            <p className={styles.customerName}>{customerInfo.name}</p>
            {customerInfo.email && <p>{customerInfo.email}</p>}
            {customerInfo.phone && <p>{customerInfo.phone}</p>}
            {customerInfo.address && <p>{customerInfo.address}</p>}
          </div>
        </div>

        {/* Notes section if available */}
        {quote.notes && (
          <div className={styles.notesSection}>
            <div className={styles.sectionTitle}>Quote Notes</div>
            <p className={styles.notes}>{quote.notes}</p>
          </div>
        )}

        {/* Quote details - tasks table */}
        <div className={styles.tasksSection}>
          <div className={styles.sectionTitle}>Quote Details</div>

          <table className={styles.tasksTable}>
            <thead>
              <tr>
                <th className="w-16 p-4">#</th>
                <th className="p-4 text-left">Description</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>{tasks.map((task, index) => renderTaskRow(task, index))}</tbody>
          </table>
        </div>

        {/* Itemized materials if any tasks have them */}
        {tasks.some((task) => task.materialType === 'itemized' && task.materials.length > 0) && (
          <div className={styles.materialsSection}>
            <div className={styles.sectionTitle}>Materials Detail</div>
            {tasks.map(
              (task, taskIndex) =>
                task.materialType === 'itemized' &&
                task.materials.length > 0 && (
                  <div key={taskIndex} className={styles.taskMaterials}>
                    <h3>{task.name || `Task ${taskIndex + 1}`}</h3>
                    <table className={styles.materialsTable}>
                      <thead>
                        <tr>
                          <th className="p-2 text-left">Item</th>
                          <th className="p-2 text-right">Quantity</th>
                          <th className="p-2 text-right">Unit Price</th>
                          <th className="p-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {task.materials.map((material, materialIndex) => (
                          <tr key={materialIndex}>
                            <td className="p-2">{material.name}</td>
                            <td className="p-2 text-right">{material.quantity}</td>
                            <td className="p-2 text-right">{formatCurrency(material.unitPrice)}</td>
                            <td className="p-2 text-right">
                              {formatCurrency(material.quantity * material.unitPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
            )}
          </div>
        )}

        {/* Totals and summary */}
        <div className={styles.summarySection}>
          <table className={styles.summaryTable}>
            <tbody>
              <tr>
                <td className={styles.summaryLabel}>Labor Total:</td>
                <td className={styles.summaryValue}>
                  {formatCurrency(
                    tasks.reduce((sum, task) => sum + parseFloat(task.price.toString()), 0)
                  )}
                </td>
              </tr>
              <tr>
                <td className={styles.summaryLabel}>Materials Total:</td>
                <td className={styles.summaryValue}>
                  {formatCurrency(
                    tasks.reduce((sum, task) => {
                      if (task.materialType === 'lumpsum') {
                        return sum + (task.estimatedMaterialsCostLumpSum || 0);
                      } else {
                        return (
                          sum +
                          task.materials.reduce(
                            (materialSum, material) =>
                              materialSum + material.quantity * material.unitPrice,
                            0
                          )
                        );
                      }
                    }, 0)
                  )}
                </td>
              </tr>
              {quote.complexityCharge > 0 && (
                <tr>
                  <td className={styles.summaryLabel}>Complexity/Contingency Charge:</td>
                  <td className={styles.summaryValue}>
                    {formatCurrency(quote.complexityCharge)}
                  </td>
                </tr>
              )}
              {quote.markupCharge > 0 && (
                <tr>
                  <td className={styles.summaryLabel}>Markup/Profit:</td>
                  <td className={styles.summaryValue}>{formatCurrency(quote.markupCharge)}</td>
                </tr>
              )}
              <tr className={styles.totalRow}>
                <td className={styles.totalLabel}>TOTAL:</td>
                <td className={styles.totalValue}>
                  {formatCurrency(quote.grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Terms and signature */}
        <div className={styles.termsSection}>
          <div className={styles.sectionTitle}>Terms and Conditions</div>
          <ul className={styles.termsList}>
            <li>This quote is valid for 30 days from the date of issue.</li>
            <li>A 50% deposit is required before work begins.</li>
            <li>Final payment is due upon completion of the project.</li>
            <li>Any changes to the scope of work must be agreed upon in writing.</li>
          </ul>
        </div>

        <div className={styles.signatureSection}>
          <div className={styles.signatureLine}>
            <div className={styles.signLabel}>Accepted By:</div>
            <div className={styles.signSpace}></div>
          </div>
          <div className={styles.signatureLine}>
            <div className={styles.signLabel}>Date:</div>
            <div className={styles.signSpace}></div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}
