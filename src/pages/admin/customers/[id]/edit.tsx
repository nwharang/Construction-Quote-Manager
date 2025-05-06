import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter, useParams } from 'next/navigation';
import { Spinner } from '@heroui/react';

import type { NextPageWithLayout } from '~/types/next';
import { CustomerFormModal, type CustomerFormData } from '~/components/customers/CustomerFormModal';
import { useTranslation } from '~/hooks/useTranslation';
import { useToastStore } from '~/store';
import { api } from '~/utils/api';
import { routes } from '~/config/routes';
import { Breadcrumb } from '~/components/shared/Breadcrumb';
import type { BreadcrumbItem } from '~/components/shared/Breadcrumb';
import { APP_NAME } from '~/config/constants';

const EditCustomerPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = params?.id as string;
  const { success: showSuccessToast, error: showErrorToast } = useToastStore();

  // Fetch customer details
  const {
    data: customer,
    isLoading,
    error,
  } = api.customer.getById.useQuery({ id: customerId }, { enabled: !!customerId, retry: false });

  // Update mutation
  const updateMutation = api.customer.update.useMutation({
    onSuccess: () => {
      showSuccessToast(t('customers.updateSuccess'));
      router.push(routes.admin.customers.list);
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      showErrorToast(error.message);
      router.push(routes.admin.customers.list);
    }
  }, [error, router, showErrorToast]);

  // Define breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] | null = customer
    ? [
        { label: t('nav.dashboard'), href: routes.admin.dashboard },
        { label: t('breadcrumb.customers.list'), href: routes.admin.customers.list },
        { label: customer.name, href: routes.admin.customers.detail(customerId) },
        {
          label: t('breadcrumb.edit'),
          href: routes.admin.customers.edit(customerId),
          isCurrent: true,
        },
      ]
    : null;

  // Dynamic title based on customer data
  const pageTitle = customer
    ? `${t('customers.edit.pageTitle')} - ${customer.name} | ${APP_NAME}`
    : `Edit Customer | ${APP_NAME}`;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!customer) {
    return <p>Customer not found or error loading.</p>;
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <div className="space-y-6">
        {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}

        <CustomerFormModal
          customer={customer}
          isOpen={true}
          onClose={() => router.back()}
          onSubmit={async (data: CustomerFormData) => {
            await updateMutation.mutateAsync({ ...data, id: customerId });
          }}
          isLoading={updateMutation.isPending}
        />
      </div>
    </>
  );
};

export default EditCustomerPage;
