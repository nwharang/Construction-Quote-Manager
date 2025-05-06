import React from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@heroui/react';

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

const NewCategoryPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { success: showSuccessToast, error: showErrorToast } = useToastStore();

  // Create category mutation
  const createCategoryMutation = api.productCategory.create.useMutation({
    onSuccess: () => {
      showSuccessToast(t('categories.createSuccess'));
      router.push(routes.admin.categories.list);
    },
    onError: (error) => {
      showErrorToast(
        t('categories.createError', { message: error.message })
      );
    },
  });

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t('nav.dashboard'), href: routes.admin.dashboard },
    { label: t('breadcrumb.categories.list'), href: routes.admin.categories.list },
    { label: t('breadcrumb.categories.new'), href: routes.admin.categories.new, isCurrent: true },
  ];

  // Handle form submission
  const handleSubmit = async (data: CategoryFormData) => {
    await createCategoryMutation.mutateAsync(data);
  };

  return (
    <>
      <Head>
        <title>{t('categories.new.pageTitle')} | {APP_NAME}</title>
      </Head>

      <div className="space-y-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-2xl font-bold">{t('categories.new')}</h1>
          <Button
            variant="light"
            startContent={<ArrowLeft size={16} />}
            onPress={() => router.push(routes.admin.categories.list)}
          >
            {t('common.back')}
          </Button>
        </div>

        <CategoryForm
          onSubmit={handleSubmit}
          isSubmitting={createCategoryMutation.isPending}
        />
      </div>
    </>
  );
};

NewCategoryPage.getLayout = (page) => <MainLayout>{page}</MainLayout>;

export default NewCategoryPage; 