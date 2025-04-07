import React from 'react';
import Head from 'next/head';

import type { NextPageWithLayout } from '~/types/next';
import { useTranslation } from '~/hooks/useTranslation';
import { ProductsList } from '~/components/products/ProductsList';
import { APP_NAME } from '~/config/constants';
import { routes } from '~/config/routes';
import { Breadcrumb } from '~/components/shared/Breadcrumb';
import type { BreadcrumbItem } from '~/components/shared/Breadcrumb';

const ProductsPage: NextPageWithLayout = () => {
  const { t } = useTranslation();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t('nav.dashboard'), href: routes.admin.dashboard },
    { label: t('breadcrumb.products.list'), href: routes.admin.products.list, isCurrent: true },
  ];

  return (
    <>
      <Head>
        <title>{t('products.list.header')} | {APP_NAME}</title>
        <meta name="description" content={t('products.list.pageDescription')} />
      </Head>

      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <ProductsList />
    </>
  );
};

export default ProductsPage;
