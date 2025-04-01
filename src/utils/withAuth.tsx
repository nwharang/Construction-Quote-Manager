import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Spinner } from '@heroui/react';
import { routes } from '~/config/routes';
import { AuthLayout, MainLayout } from '~/layouts';
import type { NextPageWithLayout } from '~/types/next';
import type { ComponentType } from 'react';

/**
 * Higher-order component that adds authentication protection to a page
 * and wraps it in the MainLayout.
 */
export function withMainLayout<P extends object>(
  Component: ComponentType<P>
): NextPageWithLayout<P> {
  const AuthenticatedComponent: NextPageWithLayout<P> = (props) => {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'unauthenticated') {
        router.push(routes.auth.signIn);
      }
    }, [status, router]);

    if (status === 'loading') {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      );
    }

    if (status === 'authenticated') {
      return <Component {...props} />;
    }

    // This return is required for TypeScript but will never render
    // due to the redirect in the useEffect
    return null;
  };

  // Set layout and authentication requirements
  AuthenticatedComponent.getLayout = (page) => <MainLayout>{page}</MainLayout>;
  AuthenticatedComponent.requireAuth = true;

  return AuthenticatedComponent;
}

/**
 * Higher-order component that prevents authenticated users from accessing a page
 * and wraps it in the AuthLayout.
 * @param Component - The component to wrap
 * @param title - Optional title to pass to AuthLayout
 */
export function withAuthLayout<P extends object>(
  Component: ComponentType<P>,
  title?: string
): NextPageWithLayout<P> {
  const PublicComponent: NextPageWithLayout<P> = (props) => {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'authenticated') {
        router.push(routes.admin.dashboard);
      }
    }, [status, router]);

    if (status === 'loading') {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      );
    }

    if (status === 'unauthenticated') {
      return <Component {...props} />;
    }

    // This return is required for TypeScript but will never render
    // due to the redirect in the useEffect
    return null;
  };

  // Set layout and authentication requirements
  PublicComponent.getLayout = (page) => <AuthLayout title={title}>{page}</AuthLayout>;
  PublicComponent.requireAuth = false;

  return PublicComponent;
}
