import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Head from 'next/head';
import { Trash, Edit } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, Chip, Divider, Spinner } from '@heroui/react';

import type { NextPageWithLayout } from '~/types/next';
import { MainLayout } from '~/layouts/MainLayout';
import { useTranslation } from '~/hooks/useTranslation';
import { useToastStore } from '~/store';
import { api } from '~/utils/api';
import { routes } from '~/config/routes';
import { formatDate } from '~/utils/date';
import { DeleteEntityDialog } from '~/components/shared/DeleteEntityDialog';
import { Breadcrumb } from '~/components/shared/Breadcrumb';
import type { BreadcrumbItem } from '~/components/shared/Breadcrumb';

const ViewProductPage: NextPageWithLayout = () => {
  const { t, formatCurrency, formatDate } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params?.id as string;
  const { error: showErrorToast, success: showSuccessToast } = useToastStore();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch product details
  const {
    data: product,
    isLoading,
    error,
  } = api.product.getById.useQuery(
    { id: productId },
    {
      enabled: !!productId,
      retry: false
    }
  );

  // Handle errors from product fetch
  useEffect(() => {
    if (error) {
      showErrorToast(error.message);
      router.push(routes.admin.products.list);
    }
  }, [error, router, showErrorToast]);

  // Delete product mutation
  const deleteMutation = api.product.delete.useMutation({
    onSuccess: () => {
      showSuccessToast(t('products.deleteSuccess'));
      router.push(routes.admin.products.list);
    },
    onError: (error) => {
      showErrorToast(error.message);
    }
  });

  // Handle delete click
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (productId) {
      await deleteMutation.mutateAsync({ id: productId });
    }
  };

  const productEntityName = t('products.entityName'); // Assuming this key exists, otherwise use "Product"

  // Define breadcrumb items (conditionally based on product loading/existence)
  const breadcrumbItems: BreadcrumbItem[] | null = product ? [
    { label: t('nav.dashboard'), href: routes.admin.dashboard },
    { label: t('breadcrumb.products.list'), href: routes.admin.products.list },
    { label: product.name, href: routes.admin.products.detail(productId), isCurrent: true }, // Use product name
  ] : null; // Don't show breadcrumbs until product is loaded

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center gap-4">
        <p className="text-danger">{error?.message || t('common.error')}</p>
        <Button color="primary" variant="flat" onPress={() => router.push(routes.admin.products.list)}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{product.name}</title>
      </Head>

      <div className="space-y-6">
        {/* Render Breadcrumb if items exist */}
        {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />} 
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              color="primary"
              variant="flat"
              startContent={<Edit className="h-4 w-4" />}
              onPress={() => router.push(routes.admin.products.edit(productId))}
            >
              {t('common.edit')}
            </Button>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              startContent={<Trash className="h-4 w-4" />}
              onPress={handleDeleteClick}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">{product.name}</h2>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-default-500">{t('products.list.price')}</p>
              <p className="text-lg font-medium">{formatCurrency(product.unitPrice)}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">{t('products.list.sku')}</p>
              <p>{product.sku || t('common.notSpecified')}</p>
            </div>
            
            {product.category && (
              <div>
                <p className="text-sm text-default-500">{t('products.list.category')}</p>
                <Chip size="sm" variant="flat" color="primary">
                  {product.category.name}
                </Chip>
              </div>
            )}
            
            <div>
              <p className="text-sm text-default-500">{t('products.list.unit')}</p>
              <p>{product.unit || t('common.notSpecified')}</p>
            </div>
            
            {product.description && (
              <div>
                <p className="text-sm text-default-500">{t('products.list.description')}</p>
                <p className="whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
            
            {product.notes && (
              <div>
                <p className="text-sm text-default-500">{t('products.list.notes')}</p>
                <p className="whitespace-pre-wrap">{product.notes}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-default-500">{t('products.list.manufacturer')}</p>
              <p>{product.manufacturer || t('common.notSpecified')}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">{t('products.list.supplier')}</p>
              <p>{product.supplier || t('common.notSpecified')}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">{t('products.list.location')}</p>
              <p>{product.location || t('common.notSpecified')}</p>
            </div>

            <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.createdAt')}</dt>
              <dd className="text-base text-gray-900 dark:text-white sm:col-span-2">{formatDate(product.createdAt)}</dd>
            </div>

            <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.updatedAt')}</dt>
              <dd className="text-base text-gray-900 dark:text-white sm:col-span-2">{formatDate(product.updatedAt)}</dd>
            </div>
          </CardBody>
        </Card>
      </div>

      <DeleteEntityDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        entityName={productEntityName}
        entityLabel={product.name}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};

ViewProductPage.getLayout = (page) => {
  return (
    <MainLayout>
      {page}
    </MainLayout>
  );
};

export default ViewProductPage;