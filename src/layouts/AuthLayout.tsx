import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from '~/hooks/useTranslation';
import { LocaleSwitch } from '~/components/LocaleSwitch';
import { ThemeToggle } from '~/components/ThemeToggle';
import { APP_NAME } from '~/config/constants';

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
  // Use client-side mounting to avoid hydration issues
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const pageTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
  
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="Quoting tool for construction contractors" />
      </Head>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {/* Only render client-side components after client-side hydration */}
          {isMounted && (
            <>
              <LocaleSwitch />
              <ThemeToggle />
            </>
          )}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center">
              <Link href="/" className="text-2xl font-bold">
                {APP_NAME}
              </Link>
            </div>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

// Set display name for debugging
AuthLayout.displayName = 'AuthLayout';
