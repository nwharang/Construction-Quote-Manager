'use client';

import React from 'react';
import Head from 'next/head';
import type { NextPageWithLayout } from '~/types/next';
import { QuotesList } from '~/components/quotes/QuotesList';
import { useTranslation } from '~/hooks/useTranslation';
import { APP_NAME } from '~/config/constants';
import { routes } from '~/config/routes';
import { Breadcrumb } from '~/components/shared/Breadcrumb';
import type { BreadcrumbItem } from '~/components/shared/Breadcrumb';

const QuotesPage: NextPageWithLayout = () => {
  const { t } = useTranslation();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t('nav.dashboard'), href: routes.admin.dashboard },
    { label: t('breadcrumb.quotes.list'), href: routes.admin.quotes.list, isCurrent: true },
  ];

  return (
    <>
      <Head>
        <title>{t('quotes.list.header')} | {APP_NAME}</title>
      </Head>
      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      <QuotesList />
    </>
  );
};

export default QuotesPage;
