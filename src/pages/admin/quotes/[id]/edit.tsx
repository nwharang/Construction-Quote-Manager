import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button, Card, CardHeader, CardBody, Spinner } from '@heroui/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { withMainLayout } from '~/utils/withAuth';
import { useTranslation } from '~/hooks/useTranslation';
import { api } from '~/utils/api';
import Link from 'next/link';
import { routes } from '~/config/routes';
import { APP_NAME } from '~/config/constants';
import { QuoteForm } from '~/components/quotes/QuoteForm';
import { useAppToast } from '~/components/providers/ToastProvider';
import type { NextPageWithLayout } from '~/types/next';

// Define the component as a regular function component
function EditQuotePageContent() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { t } = useTranslation();
  const toast = useAppToast();

  // Fetch the quote for editing
  const { data: quote, isLoading } = api.quote.getById.useQuery(
    { id },
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  );

  // Update mutation
  const { mutate: updateQuote, isPending: isSaving } = api.quote.update.useMutation({
    onSuccess: (updatedQuote) => {
      toast.success("Quote updated successfully");
      // Navigate to the view page after successful update
      router.push(routes.admin.quotes.detail(updatedQuote.id));
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update quote");
    },
  });

  const handleSubmit = (formData: any) => {
    if (id) {
      updateQuote({
        id,
        ...formData,
      });
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Handle not found state
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
        <title>Edit Quote | {APP_NAME}</title>
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
            <Link
              href={routes.admin.quotes.detail(id)}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              {quote.title || 'Quote Details'}
            </Link>
            <ChevronRight size={16} className="mx-2 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              Edit
            </span>
          </nav>
          
          <div className="flex gap-2">
            <Button
              color="primary"
              variant="light"
              startContent={<ArrowLeft size={16} />}
              onClick={() => router.push(routes.admin.quotes.detail(id))}
            >
              Cancel
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Edit Quote #{quote.sequentialId || quote.id.substring(0, 6)}</h2>
          </CardHeader>
          <CardBody>
            <QuoteForm 
              initialValues={{
                title: quote.title,
                customerId: quote.customerId,
                status: quote.status,
                markupPercentage: quote.markupPercentage,
                notes: quote.notes || '',
                // Provide empty arrays for now - these will be implemented in the future
                tasks: [],
                materials: [],
              }}
              onSubmit={handleSubmit}
              isSubmitting={isSaving}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}

// Apply the withMainLayout HOC to create the NextPageWithLayout component
const EditQuotePage = withMainLayout(EditQuotePageContent);

export default EditQuotePage; 