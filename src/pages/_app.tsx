import '@/styles/globals.css';
import React from 'react';
import type { AppProps } from 'next/app';
import { api } from '~/utils/api';
import { Providers } from '~/components/providers';
import { MainLayout, PrintLayout } from '~/layouts';

// Define AppPropsWithLayout type using the imported NextPageWithLayout
type AppPropsWithLayout = AppProps & {
  Component: AppProps['Component'] & {
    getLayout?: (page: React.ReactNode) => React.ReactNode;
  };
};

function App({ Component, pageProps, router }: AppPropsWithLayout) {
  // Determine the layout based on the route
  const getLayout = (): ((page: React.ReactNode) => React.ReactNode) => {
    if (router.pathname.includes('[id]/print')) {
      return (page) => <PrintLayout>{page}</PrintLayout>;
    }
    // Apply MainLayout by default
    return Component.getLayout || ((page) => <MainLayout>{page}</MainLayout>);
  };

  // Function to render the component with the appropriate layout
  const renderWithLayout = () => {
    const Layout = getLayout();
    return Layout(<Component {...pageProps} />);
  };

  // Apply the layout to the content
  const layoutContent = renderWithLayout();

  // Return the final rendered component wrapped in Providers
  // Providers likely handles SessionProvider internally
  return <Providers session={pageProps.session}>{layoutContent}</Providers>;
}

export default api.withTRPC(App);
