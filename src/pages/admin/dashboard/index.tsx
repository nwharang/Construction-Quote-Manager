import React from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { FileText, Plus, User, BarChart4 } from 'lucide-react';
import { api } from '~/utils/api';
import { QuoteStatus } from '~/server/db/schema';
import type { RouterOutputs } from '~/utils/api';
import { Button, Card, CardBody, CardHeader, Chip, Spinner } from '@heroui/react';

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

  // Format currency
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(value));
  };

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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Quotes */}
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
              <CardBody className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/5">
                    <FileText className="h-6 w-6 text-primary/80" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground/80">Total Quotes</p>
                    <div className="text-2xl font-bold text-foreground/90">
                      {dashboardData?.totalQuotes ?? 0}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Accepted Quotes */}
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
              <CardBody className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-success/5">
                    <FileText className="h-6 w-6 text-success/80" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground/80">Accepted Quotes</p>
                    <div className="text-2xl font-bold text-foreground/90">
                      {dashboardData?.acceptedQuotes ?? 0}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Total Customers */}
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
              <CardBody className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-warning/5">
                    <User className="h-6 w-6 text-warning/80" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground/80">Total Customers</p>
                    <div className="text-2xl font-bold text-foreground/90">
                      {dashboardData?.totalCustomers ?? 0}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Total Revenue */}
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
              <CardBody className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-info/5">
                    <BarChart4 className="h-6 w-6 text-info/80" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground/80">Total Revenue</p>
                    <div className="text-2xl font-bold text-foreground/90">
                      {formatCurrency(dashboardData?.totalRevenue ?? '0')}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
            <CardHeader className="px-6 py-4">
              <h3 className="text-lg font-medium text-foreground/90">Recent Activity</h3>
            </CardHeader>
            <CardBody className="p-6">
              {dashboardData?.recentQuotes && dashboardData.recentQuotes.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentQuotes.map((quote: Quote) => (
                    <div key={quote.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <FileText className="h-5 w-5 text-muted-foreground/60" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground/90">{quote.title}</p>
                          <p className="text-sm text-muted-foreground/80">{quote.customerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground/80">
                          {formatCurrency(quote.grandTotal)}
                        </span>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            quote.status === QuoteStatus.ACCEPTED
                              ? 'success'
                              : quote.status === QuoteStatus.REJECTED
                              ? 'danger'
                              : quote.status === QuoteStatus.SENT
                              ? 'primary'
                              : 'default'
                          }
                        >
                          {quote.status.toLowerCase()}
                        </Chip>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <h3 className="mt-2 text-sm font-medium text-foreground/90">No activity yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground/80">
                    Get started by creating your first quote.
                  </p>
                  <div className="mt-6">
                    <Button
                      color="primary"
                      startContent={<Plus className="h-5 w-5" />}
                      onPress={() => router.push('/admin/quotes/new')}
                    >
                      New Quote
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
