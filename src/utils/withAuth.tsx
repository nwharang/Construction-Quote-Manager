import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Spinner } from '@heroui/react';
import { routes } from '~/config/routes';
import { AuthLayout, MainLayout } from '~/layouts';
import type { NextPageWithLayout } from '~/types/next';
import type { ComponentType, ReactNode } from 'react';
import React from 'react';
import Head from 'next/head';
import { APP_NAME } from '~/config/constants';
import { ThemeToggle } from '~/components/ThemeToggle';

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

    // Fallback loading state while redirecting
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  };

  AuthenticatedComponent.getLayout = (page: ReactNode) => <MainLayout>{page}</MainLayout>;
  AuthenticatedComponent.requireAuth = true;
  AuthenticatedComponent.displayName = `withMainLayout(${Component.displayName || Component.name || 'Component'})`;

  return AuthenticatedComponent;
}

/**
 * Higher-order component for pages accessible only by unauthenticated users.
 * Redirects authenticated users to the dashboard.
 */
export function withoutAuth<P extends object>(
  Component: ComponentType<P>,
  title?: string
): NextPageWithLayout<P> {
  const PublicComponent: NextPageWithLayout<P> = (props) => {
    const { status } = useSession();
    const router = useRouter();

    if (status === 'loading') {
      return (
        <div className="flex h-screen items-center justify-center">
          <Spinner />
        </div>
      );
    }

    if (status === 'authenticated') {
      router.replace('/admin/dashboard'); // Or your default authenticated route
      return (
        <div className="flex h-screen items-center justify-center">
          <Spinner />
        </div>
      );
    }

    if (status === 'unauthenticated') {
      return <Component {...props} />;
    }

    // Fallback loading state (should ideally not be reached often)
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  };

  // Set layout and authentication requirements
  PublicComponent.getLayout = (page) => <AuthLayout title={title}>{page}</AuthLayout>;
  PublicComponent.requireAuth = false;

  return PublicComponent;
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
  const AuthLayoutWrapper: NextPageWithLayout<P> = (props) => {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'authenticated') {
        router.replace(routes.admin.dashboard);
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

    // Fallback loading state while redirecting authenticated users
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  };

  // Use the main AuthLayout component directly
  AuthLayoutWrapper.getLayout = (page: ReactNode) => <AuthLayout title={title}>{page}</AuthLayout>;
  AuthLayoutWrapper.requireAuth = false; // This page does *not* require auth
  AuthLayoutWrapper.displayName = `withAuthLayout(${Component.displayName || Component.name || 'Component'})`;

  return AuthLayoutWrapper;
}
