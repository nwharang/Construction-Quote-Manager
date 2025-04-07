import React from 'react';
import Head from 'next/head';
import type { NextPageWithLayout } from '~/types/next';
import { useTranslation } from '~/hooks/useTranslation';
import { APP_NAME } from '~/config/constants';
import { Breadcrumb } from '~/components/shared/Breadcrumb';
import type { BreadcrumbItem } from '~/components/shared/Breadcrumb';
import { ThemeToggle } from '~/components/ThemeToggle';
import { LocaleSwitch } from '~/components/LocaleSwitch';

const SettingsPage: NextPageWithLayout = () => {
  const { t } = useTranslation();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t('nav.dashboard'), href: '/admin/dashboard' },
    { label: t('nav.settings'), href: '/admin/settings', isCurrent: true },
  ];
  
  return (
    <>
      <Head>
        <title>{t('settings.title')} | {APP_NAME}</title>
      </Head>

      <div className="space-y-6">
        <Breadcrumb items={breadcrumbItems} />
        <h1 className="text-2xl font-semibold mb-4">{t('settings.title')}</h1>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-xl font-medium">{t('settings.language')}</h2>
              <LocaleSwitch />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-xl font-medium">{t('settings.changeTheme')}</h2>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage; 