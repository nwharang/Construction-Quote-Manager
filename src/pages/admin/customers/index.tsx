import React from 'react';
import type { NextPageWithLayout } from '~/types/next';
import Head from 'next/head';
import { MainLayout } from '~/layouts/MainLayout';
import { CustomersList } from '~/components/customers/CustomersList';
import { useTranslation } from '~/hooks/useTranslation';
import { APP_NAME } from '~/config/constants';
import { routes } from '~/config/routes';
import { Breadcrumb } from '~/components/shared/Breadcrumb';
import type { BreadcrumbItem } from '~/components/shared/Breadcrumb';

const CustomersPage: NextPageWithLayout = () => {
  const { t } = useTranslation();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t('nav.dashboard'), href: routes.admin.dashboard },
    { label: t('breadcrumb.customers.list'), href: routes.admin.customers.list, isCurrent: true },
  ];

  return (
    <>
      <Head>
        <title>{t('customers.list.pageTitle')} | {APP_NAME}</title>
        <meta name="description" content={t('customers.list.pageDescription')} />
      </Head>

      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <CustomersList />
    </>
  );
};

CustomersPage.getLayout = (page) => <MainLayout>{page}</MainLayout>;

export default CustomersPage;
