'use client';

import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import type { NextPageWithLayout } from '~/types/next';
import {
  Spinner,
  Card,
  CardHeader,
  CardBody
} from '@heroui/react';
import { useTranslation } from '~/hooks/useTranslation';
import { MainLayout } from '~/layouts/MainLayout';
import { Construction } from 'lucide-react';
import { APP_NAME } from '~/config/constants';

const QuotesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { t } = useTranslation();
  
  // Early Returns
  if (sessionStatus === 'loading') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    router.push('/api/auth/signin');
    return null;
  }
  
  return (
    <>
      <Head>
        <title>
          {t('quotes.list.title')} | {APP_NAME}
        </title>
      </Head>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('quotes.list.header')}</h1>
        </div>

        <Card className="w-full border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold">Quotes Management</h2>
          </CardHeader>
          <CardBody className="flex flex-col items-center justify-center py-16">
            <Construction size={64} className="text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              This feature is currently under development
            </h3>
            <p className="text-gray-500 mb-6 text-center max-w-md">
              The quotes management feature has been temporarily removed for maintenance and improvements. 
              It will be available again soon with enhanced functionality.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

QuotesPage.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default QuotesPage;
