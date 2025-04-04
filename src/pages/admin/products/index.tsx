import React from 'react';
import type { NextPageWithLayout } from '~/types/next';
import Head from 'next/head';
import { MainLayout } from '~/layouts/MainLayout';
import { ProductsList } from '~/components/products/ProductsList';
import { useTranslation } from '~/hooks/useTranslation';

const ProductsPage: NextPageWithLayout = () => {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{t('products.list.pageTitle')}</title>
        <meta name="description" content={t('products.list.pageDescription')} />
      </Head>
      <ProductsList />
    </>
  );
};

ProductsPage.getLayout = (page) => <MainLayout>{page}</MainLayout>;

export default ProductsPage;
