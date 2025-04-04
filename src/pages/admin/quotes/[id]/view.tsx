import { useRouter } from 'next/router';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Button,
  Spinner,
  Divider,
} from '@heroui/react';
import { ArrowLeft, Edit, Trash, Printer, ChevronRight } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';
import { api } from '~/utils/api';
import { withMainLayout } from '~/utils/withAuth';
import { useAppToast } from '~/components/providers/ToastProvider';
import { DeleteEntityDialog } from '~/components/shared/DeleteEntityDialog';
import { useState } from 'react';
import Link from 'next/link';
import { routes } from '~/config/routes';
import { QuoteStatusBadge } from '~/components/quotes/QuoteStatusBadge';
import Head from 'next/head';
import { APP_NAME } from '~/config/constants';

function QuoteDetailContent() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { t, formatDate, formatCurrency } = useTranslation();
  const toast = useAppToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: quote, isLoading } = api.quote.getById.useQuery(
    { id },
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  );

  const { mutate: deleteQuote } = api.quote.delete.useMutation({
    onSuccess: () => {
      toast.success("Quote deleted successfully");
      router.push(routes.admin.quotes.list);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete quote");
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });

  const handleDelete = async (): Promise<void> => {
    if (id) {
      setIsDeleting(true);
      return new Promise<void>((resolve) => {
        deleteQuote({ id });
        resolve();
      });
    }
    return Promise.resolve();
  };

  const handleEdit = () => {
    router.push(routes.admin.quotes.edit(id));
  };

  const handlePrint = () => {
    router.push(routes.admin.quotes.print(id));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not found state
  if (!quote) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">Quote not found</h2>
        <Button
          color="primary"
          variant="light"
          className="mt-4"
          startContent={<ArrowLeft size={16} />}
          onClick={() => router.push(routes.admin.quotes.list)}
        >
          Back to Quotes
        </Button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Quote Details | {APP_NAME}</title>
      </Head>
      
      <div className="space-y-6">
        {/* Breadcrumb and Actions */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <nav className="flex items-center">
            <Link 
              href={routes.admin.quotes.list} 
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Quotes
            </Link>
            <ChevronRight size={16} className="mx-2 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {quote.title || 'Quote Details'}
            </span>
          </nav>
          
          <div className="flex gap-2">
            <Button
              color="primary"
              variant="light"
              startContent={<ArrowLeft size={16} />}
              onClick={() => router.push(routes.admin.quotes.list)}
            >
              Back
            </Button>
            <Button
              color="primary"
              variant="flat"
              startContent={<Printer size={16} />}
              onClick={handlePrint}
            >
              Print
            </Button>
            <Button
              color="primary"
              variant="flat"
              startContent={<Edit size={16} />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            <Button
              color="danger"
              variant="flat"
              startContent={<Trash size={16} />}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Quote Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{quote.title}</h2>
              <QuoteStatusBadge status={quote.status} size="md" />
            </div>
            <p className="text-sm text-gray-500">
              Quote #{quote.sequentialId || quote.id.substring(0, 8)}
            </p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Customer Information */}
              <div>
                <h3 className="mb-2 text-lg font-semibold">Customer Information</h3>
                {quote.customer ? (
                  <div className="space-y-2">
                    <p className="font-medium">{quote.customer.name}</p>
                    {quote.customer.email && <p>{quote.customer.email}</p>}
                    {quote.customer.phone && <p>{quote.customer.phone}</p>}
                    {quote.customer.address && <p className="whitespace-pre-line">{quote.customer.address}</p>}
                  </div>
                ) : (
                  <p className="text-gray-500">Customer information not available</p>
                )}
              </div>

              {/* Quote Information */}
              <div>
                <h3 className="mb-2 text-lg font-semibold">Quote Details</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Created on:</span> {formatDate(quote.createdAt)}</p>
                  <p><span className="font-medium">Markup Percentage:</span> {quote.markupPercentage}%</p>
                  <div className="pt-2">
                    <div className="flex justify-between py-1 border-t border-gray-200">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(Number(quote.grandTotal) / (1 + quote.markupPercentage / 100))}</span>
                    </div>
                    <div className="flex justify-between py-1 font-medium">
                      <span>Grand Total:</span>
                      <span>{formatCurrency(Number(quote.grandTotal))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {quote.notes && (
              <>
                <Divider className="my-6" />
                <div>
                  <h3 className="mb-2 text-lg font-semibold">Notes</h3>
                  <p className="whitespace-pre-wrap">{quote.notes}</p>
                </div>
              </>
            )}

            {/* Tasks Section */}
            <Divider className="my-6" />
            <div>
              <h3 className="mb-2 text-lg font-semibold">Tasks</h3>
              {quote.tasks && quote.tasks.length > 0 ? (
                <div className="mt-3 space-y-4">
                  {quote.tasks.map((task) => (
                    <Card key={task.id} className="border border-gray-100">
                      <CardBody className="p-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">{task.description}</h4>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">{formatCurrency(Number(task.price))}</span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No tasks added to this quote</p>
              )}
            </div>

            {/* Materials Section */}
            <Divider className="my-6" />
            <div>
              <h3 className="mb-2 text-lg font-semibold">Materials</h3>
              {Array.isArray((quote as any).materials) && (quote as any).materials.length > 0 ? (
                <div className="mt-3 space-y-4">
                  {(quote as any).materials.map((material: { id: string, description: string, price: string | number }) => (
                    <Card key={material.id} className="border border-gray-100">
                      <CardBody className="p-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">{material.description}</h4>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">{formatCurrency(Number(material.price))}</span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No materials added to this quote</p>
              )}
            </div>
            
            <Divider className="my-6" />
            <div className="text-sm text-gray-500">
              <p>Created: {formatDate(quote.createdAt)}</p>
              <p>Last updated: {formatDate(quote.updatedAt)}</p>
            </div>
          </CardBody>
        </Card>

        {/* Delete Confirmation Dialog */}
        <DeleteEntityDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          isLoading={isDeleting}
          entityName="Quote"
          entityLabel={quote.title}
        />
      </div>
    </>
  );
}

// Apply the withMainLayout HOC to create the NextPageWithLayout component
const QuoteDetail = withMainLayout(QuoteDetailContent);

export default QuoteDetail; 