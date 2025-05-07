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
import type { QuoteFormValues } from '~/components/quotes/QuoteForm';
import { useAppToast } from '~/components/providers/ToastProvider';
import type { NextPageWithLayout } from '~/types/next';

// Define the component as a regular function component
function EditQuotePageContent() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { t } = useTranslation();
  const toast = useAppToast();
  const utils = api.useUtils(); // Get tRPC utils

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
    onSuccess: async (updatedQuote) => {
      toast.success('Quote updated successfully');

      // Prefetch data before navigating to reduce flicker
      await utils.quote.getById.prefetch({ id: updatedQuote.id });
      // Optionally keep invalidate if prefetch alone isn't enough, but usually prefetch implies needing fresh data
      // await utils.quote.getById.invalidate({ id: updatedQuote.id });
      await utils.quote.getAll.invalidate(); // Still invalidate the list query

      // Navigate to the view page after successful update and prefetch/invalidation
      router.push(routes.admin.quotes.detail(updatedQuote.id));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update quote');
    },
  });

  const handleSubmit = (formData: QuoteFormValues) => {
    if (id) {
      const { customerId, tasks: formTasks, ...restOfFormData } = formData; // Destructure tasks too

      // Ensure customerId is present before proceeding
      if (!customerId) {
        toast.error('Customer selection is required to update a quote.');
        return; // Stop execution if customerId is null or undefined
      }

      // Transform tasks: convert materialType to lowercase and filter materials
      const transformedTasks = formTasks?.map((task) => {
        // Filter materials to only include those with a valid productId
        const filteredMaterials = task.materials
          ?.filter(
            (material): material is Omit<typeof material, 'productId'> & { productId: string } =>
              typeof material.productId === 'string' && material.productId.length > 0
          )
          .map((material) => ({
            // Ensure only expected fields are sent
            productId: material.productId,
            quantity: material.quantity,
            unitPrice: material.unitPrice,
            notes: material.notes,
            // Retain material ID if present for updates
            id: material.id,
          }));

        return {
          // Retain task ID if present for updates
          id: task.id,
          description: task.description,
          price: task.price,
          materialType: task.materialType.toLowerCase() as 'lumpsum' | 'itemized', // Convert and assert type
          estimatedMaterialsCostLumpSum: task.estimatedMaterialsCostLumpSum,
          materials: filteredMaterials, // Use the filtered and cleaned materials
        };
      });

      const dataToSend = {
        ...restOfFormData,
        customerId: customerId, // Use validated customerId (guaranteed string here)
        markupPercentage: formData.markupPercentage, // Convert back to decimal (0-1)
        tasks: transformedTasks, // Use the transformed tasks array
        // Status is intentionally NOT included here
      };
      updateQuote({
        id,
        ...dataToSend, // Use the transformed data
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
        <h2 className="text-xl font-semibold">Không tìm thấy báo giá</h2>
        <Button
          color="primary"
          variant="ghost"
          className="mt-4"
          startContent={<ArrowLeft size={16} />}
          onPress={() => router.push(routes.admin.quotes.list)}
        >
          Trở lại báo giá
        </Button>
      </div>
    );
  }

  // Dynamic title based on quote data
  const pageTitle = quote
    ? `${t('quotes.edit.pageTitle')} #${quote.sequentialId || quote.id.substring(0, 6)} | ${APP_NAME}`
    : `Edit Quote | ${APP_NAME}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <div className="space-y-6">
        {/* Breadcrumb and Actions */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <Button
              color="primary"
              variant="light"
              startContent={<ArrowLeft size={16} />}
              onPress={() => router.push(routes.admin.quotes.detail(id))}
            >
              Cancel
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">
              Edit Quote #{quote.sequentialId || quote.id.substring(0, 6)}
            </h2>
          </CardHeader>
          <CardBody>
            <QuoteForm
              initialValues={{
                title: quote.title,
                customerId: quote.customerId,
                markupPercentage: quote.markupPercentage, // Convert from decimal to percentage for the form
                notes: quote.notes || '',
                tasks:
                  quote.tasks?.map((task) => ({
                    id: task.id,
                    description: task.description,
                    price: parseFloat(task.price),
                    materialType: task.materialType === 'LUMPSUM' ? 'LUMPSUM' : 'ITEMIZED',
                    estimatedMaterialsCostLumpSum: task.estimatedMaterialsCostLumpSum
                      ? parseFloat(task.estimatedMaterialsCostLumpSum)
                      : null,
                    // Map materials if they exist
                    materials:
                      task.materials?.map((material) => ({
                        id: material.id,
                        productId: material.productId,
                        productName: material.productName ?? undefined,
                        quantity: material.quantity,
                        unitPrice: parseFloat(material.unitPrice),
                        notes: material.notes || null,
                      })) || [],
                  })) || [],
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
