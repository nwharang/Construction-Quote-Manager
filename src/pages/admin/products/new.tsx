import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';

import type { NextPageWithLayout } from '~/types/next';
import { ProductForm } from '~/components/products/ProductForm';
import { useTranslation } from '~/hooks/useTranslation';
import { useToastStore } from '~/store';
import { api } from '~/utils/api';
import { routes } from '~/config/routes';
import { Breadcrumb } from '~/components/shared/Breadcrumb';
import type { BreadcrumbItem } from '~/components/shared/Breadcrumb';
import { APP_NAME } from '~/config/constants';

const CreateProductPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { success: showSuccessToast, error: showErrorToast } = useToastStore();
  
  // Create product mutation
  const createMutation = api.product.create.useMutation({
    onSuccess: () => {
      showSuccessToast(t('products.createSuccess'));
      router.push(routes.admin.products.list);
    },
    onError: (error) => {
      showErrorToast(error.message);
    }
  });
  
  // Define breadcrumb items directly
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t('nav.dashboard'), href: routes.admin.dashboard },
    { label: t('breadcrumb.products.list'), href: routes.admin.products.list },
    { label: t('breadcrumb.products.new'), href: routes.admin.products.new, isCurrent: true },
  ];
  
  return (
    <>
      <Head>
        <title>{t('products.new.pageTitle')} | {APP_NAME}</title>
      </Head>
      
      <div className="space-y-6">
        <Breadcrumb items={breadcrumbItems} />
        
        <ProductForm 
          initialData={{
            name: '',
            sku: '',
            unitPrice: 0,
            unit: '',
            description: '',
            categoryId: null,
            notes: '',
            manufacturer: '',
            supplier: '',
            location: '',
          }}
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data);
          }}
          isLoading={createMutation.isPending}
        />
      </div>
    </>
  );
};

export default CreateProductPage; 