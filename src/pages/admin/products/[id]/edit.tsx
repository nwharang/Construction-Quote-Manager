import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter, useParams } from 'next/navigation';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Spinner,
  Select,
  SelectItem,
} from '@heroui/react';
import { ArrowLeft, Save, ChevronRight } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from '~/hooks/useTranslation';
import { api } from '~/utils/api';
import { withMainLayout } from '~/utils/withAuth';
import { useAppToast } from '~/components/providers/ToastProvider';
import Link from 'next/link';
import { CurrencyInput } from '~/components/ui/CurrencyInput';
import type { NextPageWithLayout } from '~/types/next';
import { ProductForm } from '~/components/products/ProductForm';
import { useToastStore } from '~/store';
import { routes } from '~/config/routes';
import { Breadcrumb } from '~/components/shared/Breadcrumb';
import type { BreadcrumbItem } from '~/components/shared/Breadcrumb';

// Validation schema for product form
const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable(),
  categoryId: z.string().uuid('Invalid category ID').nullable(),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  unit: z.string().nullable(),
  sku: z.string().nullable(),
  manufacturer: z.string().nullable(),
  supplier: z.string().nullable(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const EditProductPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params?.id as string;
  const { success: showSuccessToast, error: showErrorToast } = useToastStore();

  // Fetch product details
  const {
    data: product,
    isLoading,
    error,
  } = api.product.getById.useQuery({ id: productId }, { enabled: !!productId, retry: false });

  // Update product mutation
  const updateMutation = api.product.update.useMutation({
    onSuccess: () => {
      showSuccessToast(t('products.updateSuccess'));
      router.push(routes.admin.products.list);
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  // Handle errors from product fetch
  useEffect(() => {
    if (error) {
      showErrorToast(error.message);
      router.push(routes.admin.products.list);
    }
  }, [error, router, showErrorToast]);

  // Define breadcrumb items (conditionally based on product loading/existence)
  const breadcrumbItems: BreadcrumbItem[] | null = product
    ? [
        { label: t('nav.dashboard'), href: routes.admin.dashboard },
        { label: t('breadcrumb.products.list'), href: routes.admin.products.list },
        { label: product.name, href: routes.admin.products.detail(productId) }, // Link to view page
        {
          label: t('breadcrumb.edit'),
          href: routes.admin.products.edit(productId),
          isCurrent: true,
        }, // Current Edit page
      ]
    : null; // Don't show breadcrumbs until product is loaded

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    // Error handled by useEffect, this is a fallback/safety
    return <p>Product not found or error loading.</p>;
  }

  // Ensure the key type is correct for parameters - this requires updating keys.ts later
  // For now, let's assume the type will be fixed. If errors persist, we adjust KeyToParams.

  return (
    <>
      <Head>
        <title>{t('products.edit.pageTitle', { name: product.name })}</title>
      </Head>

      <div className="space-y-6">
        {/* Render Breadcrumb if items exist */}
        {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}

        <ProductForm
          initialData={product} // Pass fetched product data
          onSubmit={async (data) => {
            // Ensure ID is included in the update payload
            await updateMutation.mutateAsync({ ...data, id: productId });
          }}
          isLoading={updateMutation.isPending}
        />
      </div>
    </>
  );
};

// Assuming layout applied via HOC
export default EditProductPage;
