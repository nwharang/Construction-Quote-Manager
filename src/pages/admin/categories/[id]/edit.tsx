import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Head from 'next/head';
import { ArrowLeft } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';

import type { NextPageWithLayout } from '~/types/next';
import { MainLayout } from '~/layouts/MainLayout';
import { useTranslation } from '~/hooks/useTranslation';
import { useToastStore } from '~/store';
import { api } from '~/utils/api';
import { routes } from '~/config/routes';
import { CategoryForm, type CategoryFormData } from '~/components/categories/CategoryForm';
import { Breadcrumb } from '~/components/shared/Breadcrumb';
import type { BreadcrumbItem } from '~/components/shared/Breadcrumb';
import { APP_NAME } from '~/config/constants';

const EditCategoryPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const categoryId = params?.id as string;
  const { success: showSuccessToast, error: showErrorToast } = useToastStore();

  // Fetch category details
  const {
    data: category,
    isLoading: isLoadingCategory,
    error: fetchError,
  } = api.productCategory.getById.useQuery(
    { id: categoryId },
    {
      enabled: !!categoryId,
      retry: false,
    }
  );

  // Handle fetch errors
  useEffect(() => {
    if (fetchError) {
      showErrorToast(fetchError.message);
      router.push(routes.admin.categories.list);
    }
  }, [fetchError, router, showErrorToast]);

  // Update category mutation
  const updateCategoryMutation = api.productCategory.update.useMutation({
    onSuccess: () => {
      showSuccessToast(t('categories.updateSuccess'));
      router.push(routes.admin.categories.detail(categoryId));
    },
    onError: (error) => {
      showErrorToast(t('categories.updateError', { message: error.message }));
    },
  });

  // Handle form submission
  const handleSubmit = async (data: CategoryFormData) => {
    await updateCategoryMutation.mutateAsync({
      id: categoryId,
      ...data,
    });
  };

  // Define breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] | null = category
    ? [
        { label: t('nav.dashboard'), href: routes.admin.dashboard },
        { label: t('breadcrumb.categories.list'), href: routes.admin.categories.list },
        { label: category.name, href: routes.admin.categories.detail(categoryId) },
        {
          label: t('breadcrumb.edit'),
          href: routes.admin.categories.edit(categoryId),
          isCurrent: true,
        },
      ]
    : null;

  // Dynamic title
  const pageTitle = category
    ? `${t('categories.edit.pageTitle')} - ${category.name} | ${APP_NAME}`
    : `Edit Category | ${APP_NAME}`;

  // Loading state
  if (isLoadingCategory) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  // Error state
  if (fetchError || !category) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center gap-4">
        <p className="text-danger">{fetchError?.message || t('common.error')}</p>
        <Button color="primary" onPress={() => router.push(routes.admin.categories.list)}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  // Prepare form initial data
  const initialData: CategoryFormData = {
    name: category.name,
    description: category.description || '',
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <div className="space-y-6">
        {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <Button
            variant="light"
            color='primary'
            startContent={<ArrowLeft size={16} />}
            onPress={() => router.push(routes.admin.categories.detail(categoryId))}
          >
            {t('common.back')}
          </Button>
        </div>

        <CategoryForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isSubmitting={updateCategoryMutation.isPending}
        />
      </div>
    </>
  );
};

EditCategoryPage.getLayout = (page) => <MainLayout>{page}</MainLayout>;

export default EditCategoryPage;
