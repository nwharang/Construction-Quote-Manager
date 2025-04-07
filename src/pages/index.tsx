import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import { FileText, ArrowRight, CheckCircle2, Users } from 'lucide-react';
import { api } from '~/utils/api';
import type { RouterOutputs } from '~/utils/api';
import { useTrpcErrorHandling } from '~/hooks/useTrpcWithErrorHandling';
import { routes } from '~/config/routes';

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

  // Unauthenticated User View - Public Home Page
  if (authStatus === 'unauthenticated') {
    return (
      <div>
        {/* Header/Navigation */}
        <header className="bg-background border-b border-border/30" data-testid="main-header">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Construction Quotes</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <a 
                href="/pricing" 
                className="text-foreground/80 hover:text-foreground transition"
                data-testid="pricing-link"
              >
                Pricing
              </a>
              <a 
                href="/auth/signin" 
                className="text-foreground/80 hover:text-foreground transition"
                data-testid="signin-link"
              >
                Sign In
              </a>
              <a 
                href="/auth/signup" 
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition"
                data-testid="signup-link"
              >
                Sign Up
              </a>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-background py-16 md:py-24" data-testid="hero-section">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold mb-6" data-testid="hero-heading">
                The Fastest Way to Create Construction Quotes
              </h1>
              <p className="text-foreground/70 text-lg md:text-xl mb-8">
                Save time, increase accuracy, and win more business with our easy-to-use quoting software.
              </p>
              <Button 
                size="lg" 
                color="primary" 
                as="a" 
                href="/auth/signup"
                data-testid="cta-button"
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-background/50" data-testid="features-section">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Features Designed for Contractors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-card border border-border/30 rounded-lg p-6" data-testid="feature-card">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <FileText className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Easy Quote Creation</h3>
                <p className="text-foreground/70">
                  Create professional quotes in minutes with our intuitive interface.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-card border border-border/30 rounded-lg p-6" data-testid="feature-card">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <CheckCircle2 className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Product Catalog</h3>
                <p className="text-foreground/70">
                  Manage your products and services with prices for quick addition to quotes.
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-card border border-border/30 rounded-lg p-6" data-testid="feature-card">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Customer Management</h3>
                <p className="text-foreground/70">
                  Keep track of all your customers and their project history in one place.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-background border-t border-border/30 py-8" data-testid="footer">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <h2 className="text-xl font-bold">Construction Quotes</h2>
                <p className="text-foreground/60 text-sm mt-1">Simplifying quoting for contractors</p>
              </div>
              <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-8">
                <a href="/pricing" className="text-foreground/70 hover:text-foreground transition text-sm">
                  Pricing
                </a>
                <a href="/auth/signin" className="text-foreground/70 hover:text-foreground transition text-sm">
                  Sign In
                </a>
                <a href="/auth/signup" className="text-foreground/70 hover:text-foreground transition text-sm">
                  Sign Up
                </a>
              </div>
            </div>
            <div className="mt-8 pt-4 border-t border-border/30 text-center text-foreground/60 text-sm" data-testid="copyright">
              © {new Date().getFullYear()} Construction Quotes. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    );
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
                        onPress={() => router.push(routes.admin.quotes.detail(quote.id))}
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
