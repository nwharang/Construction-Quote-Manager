import React from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Plus } from 'lucide-react';
import { api } from '~/utils/api';
import type { RouterOutputs } from '~/utils/api';
import { Button, Spinner } from '@heroui/react';
import { StatCards } from '~/components/dashboard/StatCards';
import { RecentActivity } from '~/components/dashboard/RecentActivity';

type Quote = RouterOutputs['quote']['getDashboardStats']['recentQuotes'][number];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
  } = api.quote.getDashboardStats.useQuery(undefined, {
    enabled: status === 'authenticated',
    retry: 1,
    refetchOnWindowFocus: true,
  });

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="text-danger mb-4">Failed to load dashboard data</div>
        <Button color="primary" onPress={() => router.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard | Construction Quote Manager</title>
      </Head>

      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6">
          {/* Welcome Section */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground/90">Dashboard</h1>
              <p className="text-muted-foreground/80">Welcome back, {session?.user?.name}</p>
            </div>
            <Button
              color="primary"
              startContent={<Plus className="h-5 w-5" />}
              onPress={() => router.push('/admin/quotes/new')}
            >
              New Quote
            </Button>
          </div>

          {/* Stats Cards */}
          <StatCards 
            totalQuotes={dashboardData?.totalQuotes ?? 0}
            acceptedQuotes={dashboardData?.acceptedQuotes ?? 0}
            totalCustomers={dashboardData?.totalCustomers ?? 0}
            totalRevenue={dashboardData?.totalRevenue ?? '0'}
          />

          {/* Recent Activity */}
          <RecentActivity quotes={dashboardData?.recentQuotes ?? []} />
        </div>
      </div>
    </>
  );
}
