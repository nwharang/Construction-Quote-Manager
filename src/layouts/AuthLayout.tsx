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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>{pageTitle} | Construction Pro</title>
      </Head>
      
      <header className="p-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary">
          Construction Pro
        </Link>
        <LocaleSwitch />
      </header>
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">{pageTitle}</h1>
          {children}
        </div>
      </main>
      
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Construction Pro. {t('footer.allRightsReserved')}</p>
      </footer>
    </div>
  );
}

// Set display name for debugging
AuthLayout.displayName = 'AuthLayout';

export default AuthLayout; 