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

const ViewCategoryPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const categoryId = params?.id as string;
  const { error: showErrorToast, success: showSuccessToast } = useToastStore();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch category details
  const {
    data: category,
    isLoading,
    error,
  } = api.productCategory.getById.useQuery(
    { id: categoryId },
    {
      enabled: !!categoryId,
      retry: false
    }
  );

  // Fetch products in this category
  const { data: productsData } = api.product.getAll.useQuery(
    { 
      filter: categoryId,
      page: 1,
      pageSize: 5
    },
    {
      enabled: !!categoryId
    }
  );

  // Handle errors from category fetch
  useEffect(() => {
    if (error) {
      showErrorToast(error.message);
      router.push(routes.admin.categories.list);
    }
  }, [error, router, showErrorToast]);

  // Delete category mutation
  const deleteMutation = api.productCategory.delete.useMutation({
    onSuccess: () => {
      showSuccessToast(t('categories.deleteSuccess'));
      router.push(routes.admin.categories.list);
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
    if (categoryId) {
      await deleteMutation.mutateAsync({ id: categoryId });
    }
  };

  const categoryEntityName = t('categories.entityName');

  // Define breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] | null = category ? [
    { label: t('nav.dashboard'), href: routes.admin.dashboard },
    { label: t('breadcrumb.categories.list'), href: routes.admin.categories.list },
    { label: category.name, href: routes.admin.categories.detail(categoryId), isCurrent: true },
  ] : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  // Error state
  if (error || !category) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center gap-4">
        <p className="text-danger">{error?.message || t('common.error')}</p>
        <Button color="primary" onPress={() => router.push(routes.admin.categories.list)}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{category.name}</title>
      </Head>

      <div className="space-y-6">
        {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              color="primary"
              variant="flat"
              startContent={<Edit className="h-4 w-4" />}
              onPress={() => router.push(routes.admin.categories.edit(categoryId))}
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
            <h2 className="text-xl font-semibold">{category.name}</h2>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-default-500">{t('categories.list.name')}</p>
              <p className="text-lg font-medium">{category.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">{t('categories.list.description')}</p>
              <p>{category.description || t('common.noDescription')}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">{t('categories.list.productCount')}</p>
              <Chip size="sm" variant="flat" color="primary">
                {productsData?.totalCount || 0}
              </Chip>
            </div>
            
            <div>
              <p className="text-sm text-default-500">{t('common.createdAt')}</p>
              <p>{formatDate(category.createdAt)}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">{t('common.updatedAt')}</p>
              <p>{formatDate(category.updatedAt)}</p>
            </div>
          </CardBody>
        </Card>
        
        {productsData?.data && productsData.data.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">{t('products.title')} ({Math.min(productsData.data.length, 5)} / {productsData.totalCount})</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <ul className="space-y-2">
                {productsData.data.map((product) => (
                  <li key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-default-500">{formatDate(product.createdAt)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => router.push(routes.admin.products.detail(product.id))}
                    >
                      {t('common.view')}
                    </Button>
                  </li>
                ))}
              </ul>
              {productsData.totalCount > 5 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="light"
                    onPress={() => router.push(routes.admin.products.list)}
                  >
                    {t('dashboard.recentQuotes.viewAll')}
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      <DeleteEntityDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        entityName={categoryEntityName}
        entityLabel={category.name}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};

ViewCategoryPage.getLayout = (page) => <MainLayout>{page}</MainLayout>;

export default ViewCategoryPage; 