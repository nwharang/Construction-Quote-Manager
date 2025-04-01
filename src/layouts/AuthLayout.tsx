import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from '~/utils/i18n';
import { LocaleSwitch } from '~/components/LocaleSwitch';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * Authentication layout for login, register, and password reset pages
 * Simplified layout with branding and language selection
 */
export function AuthLayout({ children, title }: AuthLayoutProps) {
  const { t } = useTranslation();
  const pageTitle = title || t('auth.login');

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>{pageTitle} | Construction Pro</title>
      </Head>

      <header className="flex items-center justify-between p-4">
        <Link href="/" className="text-primary text-2xl font-bold">
          Construction Pro
        </Link>
        <LocaleSwitch />
      </header>

      <main className="flex flex-grow items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="py-4 text-center text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} Construction Pro. {t('footer.allRightsReserved')}
        </p>
      </footer>
    </div>
  );
}

// Set display name for debugging
AuthLayout.displayName = 'AuthLayout';

export default AuthLayout;
