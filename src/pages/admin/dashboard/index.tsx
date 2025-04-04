import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import {
  Users,
  Package,
  FileText,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  AlertCircle,
  DollarSign,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { Card, CardHeader, CardBody, Chip, Spinner, Button, Alert } from '@heroui/react';
import { api } from '~/utils/api';
import { formatCurrency } from '~/utils/currency';
import { formatRelativeTime } from '~/utils/date';
import { useToastStore } from '~/store';
import { useCallback, useEffect } from 'react';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '~/server/api/root';
import { withMainLayout } from '~/utils/withAuth';
import { routes } from '~/config/routes';

// Types
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  loading?: boolean;
  error?: boolean;
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  actionLabel: string;
}

interface QuoteItem {
  id: string;
  sequentialId: number;
  title: string;
  customerName: string;
  status: string;
  date: Date;
  total: string;
}

const DashboardPage: NextPage = () => {
  const router = useRouter();
  const toast = useToastStore();

  // Handle tRPC errors

  const {
    data: statsData,
    isLoading: isStatsLoading,
    error: statsError,
  } = api.dashboard.getStats.useQuery(undefined, {
    retry: 1,
    retryDelay: 1000,
  });

  const {
    data: recentQuotesData,
    isLoading: isQuotesLoading,
    error: quotesError,
  } = api.quote.getAll.useQuery(
    {
      limit: 5,
    },
    {
      retry: 1,
    }
  );

  const handleError = useCallback(
    (error: TRPCClientErrorLike<AppRouter>) => {
      console.error('Error fetching data:', error);
      toast.error(`Error: ${error.message}`);
    },
    [toast]
  );

  // Show toast on error
  useEffect(() => {
    if (statsError) {
      handleError(statsError);
    }
  }, [statsError, handleError]);

  // Show toast for quotes error
  useEffect(() => {
    if (quotesError) {
      handleError(quotesError);
    }
  }, [quotesError, handleError]);

  // State is derived from query results
  const stats = statsData || {
    totalCustomers: 0,
    totalQuotes: 0,
    acceptedQuotes: 0,
    totalRevenue: 0,
    recentQuotes: [],
    topCustomers: [],
    // Add missing properties for the UI that don't exist in the API response type
    customerGrowth: 0,
    quoteGrowth: 0,
    totalProducts: 0,
    productGrowth: 0,
    revenueGrowth: 0,
  };

  // Type guard to check if the stats object has the growth properties
  const hasGrowthStats = (obj: typeof stats): obj is typeof stats & {
    customerGrowth: number;
    quoteGrowth: number;
    totalProducts: number;
    productGrowth: number;
    revenueGrowth: number;
  } => {
    return (
      'customerGrowth' in obj &&
      'quoteGrowth' in obj &&
      'totalProducts' in obj &&
      'productGrowth' in obj &&
      'revenueGrowth' in obj
    );
  };

  // Safely extract quotes from the response
  const getQuotes = () => {
    if (!recentQuotesData) return [];

    // Check if we have items property
    if ('items' in recentQuotesData && Array.isArray(recentQuotesData.items)) {
      return recentQuotesData.items.slice(0, 5);
    }

    // Check if we have quotes property
    if ('quotes' in recentQuotesData && Array.isArray(recentQuotesData.quotes)) {
      return recentQuotesData.quotes.slice(0, 5);
    }

    // Return empty array if we can't find quotes
    return [];
  };

  const recentQuotes = getQuotes().map((quote) => ({
    id: quote.id,
    sequentialId: quote.sequentialId || 0,
    title: quote.title,
    customerName: quote.customerName,
    status: quote.status,
    date: quote.createdAt,
    total: quote.grandTotal,
  })) as QuoteItem[];

  // Quick actions for the dashboard
  const quickActions: QuickActionProps[] = [
    {
      title: 'Create Quote',
      description: 'Start a new quote for a customer',
      icon: <FileText className="text-primary h-5 w-5" />,
      action: () => router.push(routes.admin.quotes.new),
      actionLabel: 'Create',
    },
    {
      title: 'Add Customer',
      description: 'Add a new customer to the system',
      icon: <Users className="text-primary h-5 w-5" />,
      action: () => router.push(routes.admin.customers.new),
      actionLabel: 'Add',
    },
    {
      title: 'Add Product',
      description: 'Add a new product to your catalog',
      icon: <Package className="text-primary h-5 w-5" />,
      action: () => router.push(routes.admin.products.new),
      actionLabel: 'Add',
    },
  ];

  // Render the status chip for a quote
  const renderStatusChip = (status: string) => {
    const statusMap: Record<
      string,
      { color: 'default' | 'primary' | 'success' | 'danger'; label: string }
    > = {
      DRAFT: { color: 'default', label: 'Draft' },
      SENT: { color: 'primary', label: 'Sent' },
      ACCEPTED: { color: 'success', label: 'Accepted' },
      REJECTED: { color: 'danger', label: 'Rejected' },
    };

    const { color, label } = statusMap[status] || { color: 'default', label: status };

    return (
      <Chip color={color} size="sm">
        {label}
      </Chip>
    );
  };

  // Stat card component
  const StatCard = ({ title, value, icon, change, loading, error }: StatCardProps) => (
    <Card className="h-full">
      <CardBody className="gap-2">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-danger flex flex-col items-center justify-center gap-2 py-4">
            <AlertTriangle className="h-6 w-6" />
            <span className="text-center text-sm">Failed to load data</span>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{title}</span>
              <div className="bg-primary/10 rounded-full p-2">{icon}</div>
            </div>
            <div className="text-2xl font-bold">
              {value !== undefined && value !== null ? value : '—'}
            </div>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                {change >= 0 ? (
                  <>
                    <ArrowUp className="text-success h-3 w-3" />
                    <span className="text-success">{change}% increase</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="text-danger h-3 w-3" />
                    <span className="text-danger">{Math.abs(change)}% decrease</span>
                  </>
                )}
                <span className="text-muted-foreground">from last month</span>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );

  // Quick action card component
  const QuickActionCard = ({ title, description, icon, action, actionLabel }: QuickActionProps) => (
    <Card className="h-full">
      <CardBody className="flex flex-col justify-between gap-4">
        <div>
          <div className="bg-primary/10 mb-2 inline-flex rounded-full p-2">{icon}</div>
          <h3 className="mb-1 text-base font-medium">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div>
          <Button color="primary" variant="flat" onPress={action} size="sm">
            {actionLabel}
          </Button>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <>
      <div className="p-1 sm:p-2 md:p-4">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your Construction Quote Manager dashboard
          </p>
        </div>

        {/* Stats Section */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Overview</h2>
          {isStatsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-[120px]">
                  <CardBody className="flex h-full items-center justify-center">
                    <Spinner size="md" />
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : statsError ? (
            <Alert variant="solid" color="danger">
              <AlertCircle className="h-4 w-4" />
              {statsError.message || 'Failed to load dashboard data'}
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Customers"
                value={stats.totalCustomers}
                icon={<Users className="text-muted-foreground h-4 w-4" />}
                change={hasGrowthStats(stats) ? stats.customerGrowth : undefined}
                loading={isStatsLoading}
                error={!!statsError}
              />
              <StatCard
                title="Total Quotes"
                value={stats.totalQuotes}
                icon={<FileText className="text-muted-foreground h-4 w-4" />}
                change={hasGrowthStats(stats) ? stats.quoteGrowth : undefined}
                loading={isStatsLoading}
                error={!!statsError}
              />
              <StatCard
                title="Total Products"
                value={hasGrowthStats(stats) ? stats.totalProducts : 0}
                icon={<Package className="text-muted-foreground h-4 w-4" />}
                change={hasGrowthStats(stats) ? stats.productGrowth : undefined}
                loading={isStatsLoading}
                error={!!statsError}
              />
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats.totalRevenue)}
                icon={<DollarSign className="text-muted-foreground h-4 w-4" />}
                change={hasGrowthStats(stats) ? stats.revenueGrowth : undefined}
                loading={isStatsLoading}
                error={!!statsError}
              />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Recent Quotes */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Recent Quotes</h2>
          <Card>
            <CardHeader className="flex flex-col gap-2">
              <div className="flex justify-between">
                <h3 className="text-lg font-medium">Latest Quotes</h3>
                <Button
                  variant="light"
                  color="primary"
                  endContent={<ArrowRight className="h-4 w-4" />}
                  size="sm"
                  onPress={() => router.push(routes.admin.quotes.list)}
                >
                  View all quotes
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {isQuotesLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Spinner />
                </div>
              ) : recentQuotes.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                  <FileText className="text-primary h-8 w-8 opacity-50" />
                  <p className="text-muted-foreground">No quotes yet</p>
                  <Button
                    color="primary"
                    startContent={<Plus className="h-4 w-4" />}
                    onPress={() => router.push(routes.admin.quotes.new)}
                    size="sm"
                  >
                    New Quote
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="divide-default-200 min-w-full divide-y">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Quote #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Title
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-default-200 divide-y">
                      {recentQuotes.map((quote) => (
                        <tr
                          key={quote.id}
                          className="hover:bg-default-100 cursor-pointer"
                          onClick={() => router.push(routes.admin.quotes.detail(quote.id))}
                        >
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            #{quote.sequentialId}
                          </td>
                          <td className="px-4 py-3 text-sm">{quote.title}</td>
                          <td className="px-4 py-3 text-sm">{quote.customerName}</td>
                          <td className="px-4 py-3 text-sm">{renderStatusChip(quote.status)}</td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {formatRelativeTime(quote.date)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium whitespace-nowrap">
                            {formatCurrency(quote.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
};

// Export with the withAuth HOC instead of relying on _app.tsx to apply protection
export default withMainLayout(DashboardPage);
