import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Head from 'next/head';
import { Trash, Edit } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, Divider, Spinner } from '@heroui/react';

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

const ViewCustomerPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = params?.id as string;
  const { error: showErrorToast, success: showSuccessToast } = useToastStore();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch customer details
  const {
    data: customer,
    isLoading,
    error,
  } = api.customer.getById.useQuery(
    { id: customerId },
    {
      enabled: !!customerId,
      retry: false
    }
  );

  // Fetch quotes from this customer
  const { data: customerQuotes } = api.quote.getAll.useQuery(
    { 
      customerId,
      page: 1,
      limit: 5 
    },
    {
      enabled: !!customerId
    }
  );

  // Handle errors from customer fetch
  useEffect(() => {
    if (error) {
      showErrorToast(error.message);
      router.push(routes.admin.customers.list);
    }
  }, [error, router, showErrorToast]);

  // Delete customer mutation
  const deleteMutation = api.customer.delete.useMutation({
    onSuccess: () => {
      showSuccessToast(t('customers.deleteSuccess'));
      router.push(routes.admin.customers.list);
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
    if (customerId) {
      await deleteMutation.mutateAsync({ id: customerId });
    }
  };

  const customerEntityName = t('customers.entityName');

  // Define breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] | null = customer ? [
    { label: t('nav.dashboard'), href: routes.admin.dashboard },
    { label: t('breadcrumb.customers.list'), href: routes.admin.customers.list },
    { label: customer.name, href: routes.admin.customers.detail(customerId), isCurrent: true },
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
  if (error || !customer) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center gap-4">
        <p className="text-danger">{error?.message || t('common.error')}</p>
        <Button color="primary" onPress={() => router.push(routes.admin.customers.list)}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{customer.name}</title>
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
              onPress={() => router.push(routes.admin.customers.edit(customerId))}
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
            <h2 className="text-xl font-semibold">{customer.name}</h2>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-default-500">{t('customers.list.name')}</p>
              <p className="text-lg font-medium">{customer.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">{t('customers.list.email')}</p>
              <p>{customer.email || t('common.notSpecified')}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">{t('customers.list.phone')}</p>
              <p>{customer.phone || t('common.notSpecified')}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">{t('customers.list.address')}</p>
              <p className="whitespace-pre-wrap">{customer.address || t('common.notSpecified')}</p>
            </div>
            
            {customer.notes && (
              <div>
                <p className="text-sm text-default-500">{t('customers.list.notes')}</p>
                <p className="whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-default-500">{t('common.createdAt')}</p>
              <p>{formatDate(customer.createdAt)}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">{t('common.updatedAt')}</p>
              <p>{formatDate(customer.updatedAt)}</p>
            </div>
          </CardBody>
        </Card>
        
        {customerQuotes?.items && customerQuotes.items.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">{t('quotes.title')} ({Math.min(customerQuotes.items.length, 5)} / {customerQuotes.total})</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <ul className="space-y-2">
                {customerQuotes.items.map((quote) => (
                  <li key={quote.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{quote.title || `Quote #${quote.id.substring(0, 8)}`}</p>
                      <p className="text-sm text-default-500">{formatDate(quote.createdAt)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => router.push(routes.admin.quotes.detail(quote.id))}
                    >
                      {t('common.view')}
                    </Button>
                  </li>
                ))}
              </ul>
              {customerQuotes.total > 5 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="light"
                    onPress={() => router.push(routes.admin.quotes.list)}
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
        entityName={customerEntityName}
        entityLabel={customer.name}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};

ViewCustomerPage.getLayout = (page) => <MainLayout>{page}</MainLayout>;

export default ViewCustomerPage; 