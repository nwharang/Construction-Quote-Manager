import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button, Card, CardHeader, CardBody } from '@heroui/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { withMainLayout } from '~/utils/withAuth';
import { useTranslation } from '~/hooks/useTranslation';
import { api } from '~/utils/api';
import Link from 'next/link';
import { routes } from '~/config/routes';
import { APP_NAME } from '~/config/constants';
import { QuoteForm, type QuoteFormValues } from '~/components/quotes/QuoteForm';
import { useAppToast } from '~/components/providers/ToastProvider';
import type { NextPageWithLayout } from '~/types/next';
import React from 'react';
import { Breadcrumb } from '~/components/shared/Breadcrumb';
import type { BreadcrumbItem } from '~/components/shared/Breadcrumb';

// Define the component as a regular function component
function NewQuotePageContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useAppToast();

  // Create mutation
  const { mutate: createQuote, isPending: isCreating } = api.quote.create.useMutation({
    onSuccess: (newQuote) => {
      toast.success('Quote created successfully');
      router.push(routes.admin.quotes.detail(newQuote.id));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create quote');
    },
  });

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t('nav.dashboard'), href: routes.admin.dashboard },
    { label: t('breadcrumb.quotes.list'), href: routes.admin.quotes.list },
    { label: t('breadcrumb.quotes.new'), href: routes.admin.quotes.new, isCurrent: true },
  ];

  const pageTitleKey = 'quotes.new.pageTitle' as const; // Add i18n key

  const handleSubmit = (formData: QuoteFormValues) => {
    const { tasks: formTasks, ...restOfFormData } = formData; // Destructure tasks

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
          productName: material.productName,
          quantity: material.quantity,
          unitPrice: material.unitPrice,
          notes: material.notes,
        }));

      return {
        ...task,
        materialType: task.materialType.toLowerCase() as 'lumpsum' | 'itemized',
        materials: filteredMaterials, // Use the filtered and cleaned materials
        // Fix: rename estimatedMaterialsCost to estimatedMaterialsCostLumpSum
        estimatedMaterialsCostLumpSum: task.estimatedMaterialsCostLumpSum,
        // Remove fields not expected by API (like client-side id)
        id: undefined,
      };
    });

    const dataToSend = {
      ...restOfFormData,
      markupPercentage: formData.markupPercentage, // Convert back to decimal (0-1)
      tasks: transformedTasks, // Use transformed tasks
    };
    createQuote(dataToSend);
  };

  return (
    <>
      <Head>
        <title>
          {t('quotes.new.pageTitle')} | {APP_NAME}
        </title>
      </Head>

      <div className="space-y-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <Button
              color="primary"
              variant="light"
              startContent={<ArrowLeft size={16} />}
              onPress={() => router.push(routes.admin.quotes.list)}
            >
              Cancel
            </Button>
          </div>
        </div>

        <Card>
          <CardBody>
            <QuoteForm onSubmit={handleSubmit} isSubmitting={isCreating} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}

// Apply the withMainLayout HOC to create the NextPageWithLayout component
const NewQuotePage = withMainLayout(NewQuotePageContent);

export default NewQuotePage;
