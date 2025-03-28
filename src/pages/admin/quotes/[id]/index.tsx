import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Edit, Trash2, ArrowLeft, FileText, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import { api } from '~/utils/api';
import { toast } from 'react-hot-toast';
import { QuoteStatus } from '~/server/db/schema';
import { type TRPCClientErrorLike } from '@trpc/client';
import { type AppRouter } from '~/server/api/root';
import { type RouterOutputs } from "~/utils/api";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Spinner,
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from '@heroui/react';

type QuoteStatusType = typeof QuoteStatus[keyof typeof QuoteStatus];
type QuoteResponse = RouterOutputs["quote"]["getById"];
type Task = QuoteResponse["tasks"][number];
type Material = Task["materials"][number];

interface Quote {
  id: string;
  title: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  status: QuoteStatusType;
  subtotalTasks: string;
  subtotalMaterials: string;
  complexityCharge: string;
  markupCharge: string;
  grandTotal: string;
  notes?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  tasks: Task[];
}

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  let bgColor = '';
  let textColor = '';
  let icon = null;
  
  switch (status) {
    case 'DRAFT':
      bgColor = 'bg-gray-200';
      textColor = 'text-gray-800';
      icon = <Clock className="h-4 w-4 mr-1" />;
      break;
    case 'SENT':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      icon = <Send className="h-4 w-4 mr-1" />;
      break;
    case 'ACCEPTED':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      icon = <CheckCircle className="h-4 w-4 mr-1" />;
      break;
    case 'REJECTED':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      icon = <XCircle className="h-4 w-4 mr-1" />;
      break;
    default:
      bgColor = 'bg-gray-200';
      textColor = 'text-gray-800';
      icon = <Clock className="h-4 w-4 mr-1" />;
  }
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${bgColor} ${textColor}`}>
      {icon}
      {status}
    </span>
  );
};

export default function QuoteDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Fetch quote data using tRPC
  const { data: quote, isLoading } = api.quote.getById.useQuery(
    { id: id as string },
    { enabled: !!id && status === 'authenticated' }
  );

  // Delete mutation
  const deleteMutation = api.quote.delete.useMutation({
    onSuccess: () => {
      toast.success('Quote deleted successfully');
      router.push('/admin/quotes');
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      toast.error(`Error deleting quote: ${error.message}`);
    },
  });

  // Update mutation for status changes
  const updateMutation = api.quote.update.useMutation({
    onSuccess: () => {
      toast.success('Quote status updated successfully');
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      toast.error(`Error updating quote status: ${error.message}`);
    },
  });
  
  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  
  // Error state
  if (!quote) {
    return (
      <div className="flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Quote not found</h1>
          <button
            onClick={() => router.push('/admin/quotes')}
            className="text-blue-600 hover:text-blue-800"
          >
            Return to quotes list
          </button>
        </div>
      </div>
    );
  }
  
  // Format currency helper
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numValue);
  };
  
  // Format date helper
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Calculate task total
  const calculateTaskTotal = (task: Task) => {
    const taskPrice = parseFloat(task.price);
    
    if (task.materials.length === 0) {
      return formatCurrency(task.price);
    }
    
    const materialsTotal = task.materials.reduce(
      (sum: number, material: Material) => sum + parseFloat(material.unitPrice) * material.quantity, 
      0
    );
    
    return formatCurrency((taskPrice + materialsTotal).toString());
  };
  
  // Handle status change
  const handleStatusUpdate = (newStatus: QuoteStatusType) => {
    updateMutation.mutate({ id: quote.id, status: newStatus });
  };
  
  // Handle delete
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this quote?')) {
      deleteMutation.mutate({ id: quote.id });
    }
  };
  
  return (
    <>
      <Head>
        <title>{quote.title} | Construction Quote Manager</title>
      </Head>
      
      <div className="container mx-auto px-4">
        {/* Back button and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <button
            onClick={() => router.push('/admin/quotes')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4 sm:mb-0"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Quotes
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/admin/quotes/${id}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Print
            </button>
            
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
        
        {/* Quote information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quote.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Quote #{quote.id} • Created on {formatDate(quote.createdAt)}</p>
              </div>
              
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row sm:items-center">
                <StatusBadge status={quote.status} />
                
                {quote.status === 'DRAFT' && (
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <button
                      onClick={() => handleStatusUpdate('SENT')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Quote
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Customer information */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{quote.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{quote.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{quote.customerPhone}</p>
              </div>
            </div>
          </div>
          
          {/* Tasks and materials */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tasks and Materials</h2>
            
            <div className="space-y-6">
              {quote.tasks.map((task, index) => (
                <Card key={task.id} className="w-full">
                  <CardHeader className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">{task.description}</h3>
                      <p className="text-sm text-gray-500">
                        Price: {formatCurrency(task.price)}
                      </p>
                    </div>
                  </CardHeader>
                  <Divider/>
                  <CardBody>
                    <Table 
                      aria-label={`Materials for task ${index + 1}`}
                      isHeaderSticky
                      classNames={{
                        base: "max-h-[400px] overflow-auto",
                        table: "min-h-[150px]",
                      }}
                    >
                      <TableHeader>
                        <TableColumn>PRODUCT</TableColumn>
                        <TableColumn>QUANTITY</TableColumn>
                        <TableColumn>UNIT PRICE</TableColumn>
                        <TableColumn>TOTAL</TableColumn>
                        <TableColumn>NOTES</TableColumn>
                      </TableHeader>
                      <TableBody
                        items={task.materials}
                        emptyContent="No materials found"
                        loadingContent={<Spinner />}
                      >
                        {(material) => (
                          <TableRow key={material.id}>
                            <TableCell>{material.product?.name ?? 'Unknown Product'}</TableCell>
                            <TableCell>{material.quantity}</TableCell>
                            <TableCell>{formatCurrency(material.unitPrice)}</TableCell>
                            <TableCell>
                              {formatCurrency(material.quantity * parseFloat(material.unitPrice))}
                            </TableCell>
                            <TableCell>{material.notes || '-'}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Notes */}
          {quote.notes && (
            <div className="border-b border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Notes</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
          
          {/* Quote summary */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quote Summary</h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal (Tasks)</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(quote.subtotalTasks)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal (Materials)</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(quote.subtotalMaterials)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Complexity Charge</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(quote.complexityCharge)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Markup Charge</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(quote.markupCharge)}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                  <span className="text-base font-medium text-gray-900 dark:text-white">Grand Total</span>
                  <span className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(quote.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {showConfirmDelete && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Delete Quote
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this quote? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 