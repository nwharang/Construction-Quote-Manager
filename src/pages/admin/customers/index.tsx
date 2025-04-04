import React from 'react';
import type { NextPageWithLayout } from '~/types/next';
import Head from 'next/head';
import { MainLayout } from '~/layouts/MainLayout';
import { CustomersList } from '~/components/customers/CustomersList';
import { useTranslation } from '~/hooks/useTranslation';

const CustomersPage: NextPageWithLayout = () => {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{t('customers.list.pageTitle')}</title>
        <meta name="description" content={t('customers.list.pageDescription')} />
      </Head>
      <CustomersList />
    </>
  );
};

CustomersPage.getLayout = (page) => <MainLayout>{page}</MainLayout>;

export default CustomersPage;
