import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import { FileText, ArrowRight, CheckCircle2, Users } from 'lucide-react';
import { api } from '~/utils/api';
import type { RouterOutputs } from '~/utils/api';
import { useTrpcErrorHandling } from '~/hooks/useTrpcWithErrorHandling';

type Quote = RouterOutputs['quote']['getAll']['items'][number];

export default function Home() {
  const router = useRouter();
  const { status: authStatus } = useSession();

  // Conditionally fetch quotes only when authenticated with error handling
  const { data: quotesData, isLoading: isQuotesLoading } = useTrpcErrorHandling(
    api.quote.getAll.useQuery(
      { page: 1, limit: 10 },
      {
        enabled: authStatus === 'authenticated',
        // Don't refetch on window focus to avoid unnecessary requests
        refetchOnWindowFocus: false,
      }
    ),
    {
      fallbackMessage: 'Failed to load quotes data',
    }
  );

  // Loading state
  if (authStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // If not logged in, redirect to signin
  if (authStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Get stats from the quotes data
  const totalQuotes = quotesData?.total ?? 0;
  const quotes = quotesData?.items ?? [];
  const acceptedQuotes = quotes.filter((q) => q.status === 'ACCEPTED').length;
  const pendingQuotes = quotes.filter((q) => q.status === 'SENT').length;

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col gap-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground/90 text-2xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground/80">Manage your construction quotes</p>
          </div>
          <Button
            color="primary"
            startContent={<FileText size={20} />}
            onPress={() => router.push('/admin/quotes/new')}
          >
            New Quote
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Total Quotes */}
          <Card className="bg-card/50 border-border/50 border backdrop-blur-sm">
            <CardBody className="p-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary/5 rounded-lg p-2">
                  <FileText size={24} className="text-primary/80" />
                </div>
                <div>
                  <p className="text-muted-foreground/80 text-sm">Total Quotes</p>
                  <div className="text-foreground/90 text-2xl font-semibold">
                    {isQuotesLoading ? <Spinner /> : totalQuotes}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Accepted Quotes */}
          <Card className="bg-card/50 border-border/50 border backdrop-blur-sm">
            <CardBody className="p-4">
              <div className="flex items-center gap-4">
                <div className="bg-success/5 rounded-lg p-2">
                  <CheckCircle2 size={24} className="text-success/80" />
                </div>
                <div>
                  <p className="text-muted-foreground/80 text-sm">Accepted Quotes</p>
                  <div className="text-foreground/90 text-2xl font-semibold">
                    {isQuotesLoading ? <Spinner /> : acceptedQuotes}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Pending Quotes */}
          <Card className="bg-card/50 border-border/50 border backdrop-blur-sm">
            <CardBody className="p-4">
              <div className="flex items-center gap-4">
                <div className="bg-warning/5 rounded-lg p-2">
                  <Users size={24} className="text-warning/80" />
                </div>
                <div>
                  <p className="text-muted-foreground/80 text-sm">Pending Quotes</p>
                  <div className="text-foreground/90 text-2xl font-semibold">
                    {isQuotesLoading ? <Spinner /> : pendingQuotes}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="bg-card/50 border-border/50 border backdrop-blur-sm">
            <CardBody className="p-6">
              <h3 className="text-foreground/90 mb-4 text-lg font-medium">Quick Actions</h3>
              <div className="space-y-4">
                <Button
                  variant="flat"
                  color="primary"
                  className="w-full justify-start"
                  startContent={<FileText size={20} />}
                  onPress={() => router.push('/admin/quotes/new')}
                >
                  Create New Quote
                </Button>
                <Button
                  variant="flat"
                  color="default"
                  className="w-full justify-start"
                  startContent={<ArrowRight size={20} />}
                  onPress={() => router.push('/admin/quotes')}
                >
                  View All Quotes
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-card/50 border-border/50 border backdrop-blur-sm">
            <CardBody className="p-6">
              <h3 className="text-foreground/90 mb-4 text-lg font-medium">Recent Activity</h3>
              {quotes.length > 0 ? (
                <div className="space-y-4">
                  {quotes.slice(0, 3).map((quote: Quote) => (
                    <div key={quote.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-foreground/90 text-sm font-medium">{quote.title}</p>
                        <p className="text-muted-foreground/80 text-sm">{quote.customer.name}</p>
                      </div>
                      <Button
                        isIconOnly
                        variant="light"
                        onPress={() => router.push(`/admin/quotes/${quote.id}`)}
                      >
                        <ArrowRight size={20} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-muted-foreground/80 text-sm">No recent activity</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
