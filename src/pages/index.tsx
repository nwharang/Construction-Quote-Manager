import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import { FileText, ArrowRight, CheckCircle2, Users } from 'lucide-react';
import { api } from '~/utils/api';
import type { RouterOutputs } from '~/utils/api';
import { QuoteStatus } from '~/server/db/schema';
import { useTrpcErrorHandling } from '~/hooks/useTrpcWithErrorHandling';

type Quote = RouterOutputs['quote']['getAll']['quotes'][number];

export default function Home() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  // Conditionally fetch quotes only when authenticated with error handling
  const { 
    data: quotesData, 
    isLoading: isQuotesLoading 
  } = useTrpcErrorHandling(
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
      <div className="flex justify-center items-center min-h-screen">
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
  const quotes = quotesData?.quotes ?? [];
  const acceptedQuotes = quotes.filter((q) => q.status === QuoteStatus.ACCEPTED).length;
  const pendingQuotes = quotes.filter((q) => q.status === QuoteStatus.SENT).length;

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col gap-6">
        {/* Welcome Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground/90">Welcome Back</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Quotes */}
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
            <CardBody className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/5">
                  <FileText size={24} className="text-primary/80" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground/80">Total Quotes</p>
                  <div className="text-2xl font-semibold text-foreground/90">
                    {isQuotesLoading ? <Spinner /> : totalQuotes}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Accepted Quotes */}
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
            <CardBody className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-success/5">
                  <CheckCircle2 size={24} className="text-success/80" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground/80">Accepted Quotes</p>
                  <div className="text-2xl font-semibold text-foreground/90">
                    {isQuotesLoading ? <Spinner /> : acceptedQuotes}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Pending Quotes */}
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
            <CardBody className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-warning/5">
                  <Users size={24} className="text-warning/80" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground/80">Pending Quotes</p>
                  <div className="text-2xl font-semibold text-foreground/90">
                    {isQuotesLoading ? <Spinner /> : pendingQuotes}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
            <CardBody className="p-6">
              <h3 className="text-lg font-medium text-foreground/90 mb-4">Quick Actions</h3>
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

          <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
            <CardBody className="p-6">
              <h3 className="text-lg font-medium text-foreground/90 mb-4">Recent Activity</h3>
              {quotes.length > 0 ? (
                <div className="space-y-4">
                  {quotes.slice(0, 3).map((quote: Quote) => (
                    <div key={quote.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground/90">{quote.title}</p>
                        <p className="text-sm text-muted-foreground/80">{quote.customerName}</p>
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
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground/80">No recent activity</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
