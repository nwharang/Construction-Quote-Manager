import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Card, CardBody, CardHeader, Button, Spinner } from '@nextui-org/react';
import { FileText, ArrowRight, CheckCircle2, Users } from 'lucide-react';
import { api } from '~/utils/api';

export default function Home() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  // Conditionally fetch quotes only when authenticated
  const { 
    data: quotes, 
    isLoading: isQuotesLoading 
  } = api.quote.getAll.useQuery(undefined, {
    enabled: authStatus === 'authenticated',
    // Don't refetch on window focus to avoid unnecessary requests
    refetchOnWindowFocus: false,
  });
  
  // Loading state
  if (authStatus === 'loading') {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }
  
  // If not logged in, redirect to signin
  if (authStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  
  // Get stats from the quotes data
  const totalQuotes = quotes?.length || 0;
  const acceptedQuotes = quotes?.filter(q => q.status === 'ACCEPTED').length || 0;
  const pendingQuotes = quotes?.filter(q => q.status === 'SENT').length || 0;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Welcome, {session?.user?.name || 'Contractor'}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your construction quotes and win more jobs
          </p>
        </div>
        
        <Button
          color="primary"
          endContent={<ArrowRight size={16} />}
          onClick={() => router.push('/quotes/new')}
          className="mt-4 md:mt-0"
        >
          Create New Quote
        </Button>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-none">
          <CardBody className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Quotes</p>
                <p className="text-2xl font-semibold">
                  {isQuotesLoading ? <Spinner size="sm" /> : totalQuotes}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none">
          <CardBody className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 size={24} className="text-success" />
              </div>
              <div>
                <p className="text-sm text-default-500">Accepted Quotes</p>
                <p className="text-2xl font-semibold">
                  {isQuotesLoading ? <Spinner size="sm" /> : acceptedQuotes}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none">
          <CardBody className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-warning/10">
                <Users size={24} className="text-warning" />
              </div>
              <div>
                <p className="text-sm text-default-500">Pending Quotes</p>
                <p className="text-2xl font-semibold">
                  {isQuotesLoading ? <Spinner size="sm" /> : pendingQuotes}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Recent Quotes Section */}
      <Card className="mb-8">
        <CardHeader className="flex justify-between">
          <h2 className="text-lg font-semibold">Recent Quotes</h2>
          <Button
            color="primary"
            variant="light"
            onClick={() => router.push('/quotes')}
            endContent={<ArrowRight size={16} />}
            size="sm"
          >
            View All
          </Button>
        </CardHeader>
        <CardBody>
          {isQuotesLoading ? (
            <div className="flex justify-center p-8">
              <Spinner />
            </div>
          ) : quotes && quotes.length > 0 ? (
            <div className="space-y-4">
              {quotes.slice(0, 5).map((quote) => (
                <div 
                  key={quote.id} 
                  className="border border-default-200 dark:border-default-100/20 rounded-lg p-4 hover:bg-default-100/40 dark:hover:bg-default-50/10 cursor-pointer transition-colors"
                  onClick={() => router.push(`/quotes/${quote.id}`)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{quote.title}</h3>
                      <p className="text-small text-default-500">
                        {quote.customerName} • Created {new Date(quote.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        quote.status === 'DRAFT' ? 'bg-default-100 dark:bg-default-50/20' : 
                        quote.status === 'SENT' ? 'bg-primary/10 text-primary' : 
                        quote.status === 'ACCEPTED' ? 'bg-success/10 text-success' : 
                        'bg-danger/10 text-danger'
                      }`}>
                        {quote.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-default-400 mb-4" />
              <h3 className="text-lg font-medium">No quotes yet</h3>
              <p className="text-default-500 max-w-md mx-auto mt-2">
                Start creating construction quotes to help you track and manage your jobs.
              </p>
              <Button
                color="primary"
                className="mt-4"
                onClick={() => router.push('/quotes/new')}
              >
                Create First Quote
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
} 