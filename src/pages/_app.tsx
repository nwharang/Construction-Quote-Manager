import '@/styles/globals.css';
import React from 'react';
import type { AppProps } from 'next/app';
import { Providers } from '~/components/providers';
import { api } from '~/utils/api';
import { MainLayout, PrintLayout, AuthLayout } from '~/layouts';

// Helper function to determine the layout based on the route
const getLayout = (pathname: string) => {
  // Print layout for print routes
  if (pathname.includes('/print')) {
    return 'print';
  }

  // Auth layout for auth routes
  if (pathname.includes('/auth')) {
    return 'auth';
  }

  // Default to main layout
  return 'main';
};

// Helper to create a page with the appropriate layout
const withLayout = (page: React.ReactNode, layout: string) => {
  switch (layout) {
    case 'print':
      return <PrintLayout>{page}</PrintLayout>;
    case 'auth':
      return <AuthLayout>{page}</AuthLayout>;
    default:
      return <MainLayout>{page}</MainLayout>;
  }
};

type AppPropsWithLayout = AppProps & {
  Component: AppProps['Component'] & {
    getLayout?: (page: React.ReactNode) => React.ReactNode;
  };
};

function App({ Component, pageProps, router }: AppPropsWithLayout) {
  // Check if the component has a custom getLayout function
  const getPageLayout = Component.getLayout ?? ((page) => page);

  // Otherwise, use the default layout
  const currentLayout = getLayout(router.pathname);

  return (
    <Providers session={pageProps.session}>
      {Component.getLayout
        ? getPageLayout(<Component {...pageProps} />)
        : withLayout(<Component {...pageProps} />, currentLayout)}
    </Providers>
  );
}

export default api.withTRPC(App);
