'use client';

import React from 'react';
import Head from 'next/head';
import type { NextPageWithLayout } from '~/types/next';
import { MainLayout } from '~/layouts/MainLayout';
import { QuotesList } from '~/components/quotes/QuotesList';
import { useTranslation } from '~/hooks/useTranslation';
import { APP_NAME } from '~/config/constants';

const QuotesPage: NextPageWithLayout = () => {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{t('quotes.list.header')} | {APP_NAME}</title>
      </Head>
      <QuotesList />
    </>
  );
};

QuotesPage.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default QuotesPage;
