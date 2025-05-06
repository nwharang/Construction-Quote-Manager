import React from 'react';
import type { NextPageWithLayout } from '~/types/next';
import { MainLayout } from '~/layouts/MainLayout';
import { CategoriesList } from '~/components/categories/CategoriesList';
import { useTranslation } from '~/hooks/useTranslation';
import { routes } from '~/config/routes';
import { Breadcrumb, type BreadcrumbItem } from '~/components/shared/Breadcrumb';
import Head from 'next/head';
import { APP_NAME } from '~/config/constants';

const CategoriesPage: NextPageWithLayout = () => {
  const { t } = useTranslation();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t('nav.dashboard'), href: routes.admin.dashboard },
    { label: t('breadcrumb.categories.list'), href: routes.admin.categories.list, isCurrent: true },
  ];

  return (
    <>
      <Head>
        <title>{t('categories.list.pageTitle')} | {APP_NAME}</title>
        <meta name="description" content="Manage your product categories." />
      </Head>

      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <CategoriesList />
    </>
  );
};

CategoriesPage.getLayout = (page) => <MainLayout>{page}</MainLayout>;

export default CategoriesPage;
