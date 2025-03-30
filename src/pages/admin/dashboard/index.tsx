import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Users, Package, FileText, CreditCard, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardHeader, CardBody, Chip, Spinner, Button } from '@heroui/react';
import { api } from '~/utils/api';
import { Layout } from '~/components/Layout';
import { formatCurrency } from '~/utils/currency';
import { formatDate, formatRelativeTime } from '~/utils/date';

// Types
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  loading?: boolean;
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  actionLabel: string;
}

const DashboardPage: NextPage = () => {
  const router = useRouter();

  const { data: statsData, isLoading: isStatsLoading } = api.dashboard.getStats.useQuery();
  const { data: recentQuotesData, isLoading: isQuotesLoading } = api.quote.getAll.useQuery({
    limit: 5,
  });

  // State is derived from query results
  const stats = statsData || {
    totalCustomers: 0,
    totalQuotes: 0,
    totalProducts: 0,
    totalRevenue: 0,
    customerGrowth: 0,
    quoteGrowth: 0,
    productGrowth: 0,
    revenueGrowth: 0,
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
  
  const recentQuotes = getQuotes().map((quote: any) => ({
    id: quote.id,
    sequentialId: quote.sequentialId || 0,
    title: quote.title,
    customerName: quote.customerName,
    status: quote.status,
    date: quote.createdAt,
    total: quote.grandTotal,
  }));

  // Quick actions for the dashboard
  const quickActions: QuickActionProps[] = [
    {
      title: 'Create Quote',
      description: 'Start a new quote for a customer',
      icon: <FileText className="text-primary h-5 w-5" />,
      action: () => router.push('/admin/quotes/new'),
      actionLabel: 'Create',
    },
    {
      title: 'Add Customer',
      description: 'Add a new customer to the system',
      icon: <Users className="text-primary h-5 w-5" />,
      action: () => router.push('/admin/customers/new'),
      actionLabel: 'Add',
    },
    {
      title: 'Add Product',
      description: 'Add a new product to your catalog',
      icon: <Package className="text-primary h-5 w-5" />,
      action: () => router.push('/admin/products/new'),
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
  const StatCard = ({ title, value, icon, change, loading }: StatCardProps) => (
    <Card className="h-full">
      <CardBody className="gap-2">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{title}</span>
              <div className="bg-primary/10 rounded-full p-2">{icon}</div>
            </div>
            <div className="text-2xl font-bold">{value}</div>
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
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your Construction Quote Manager dashboard
          </p>
        </div>

        {/* Stats Section */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers}
              icon={<Users className="text-primary h-5 w-5" />}
              change={stats.customerGrowth}
              loading={isStatsLoading}
            />
            <StatCard
              title="Total Quotes"
              value={stats.totalQuotes}
              icon={<FileText className="text-primary h-5 w-5" />}
              change={stats.quoteGrowth}
              loading={isStatsLoading}
            />
            <StatCard
              title="Total Products"
              value={stats.totalProducts}
              icon={<Package className="text-primary h-5 w-5" />}
              change={stats.productGrowth}
              loading={isStatsLoading}
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              icon={<CreditCard className="text-primary h-5 w-5" />}
              change={stats.revenueGrowth}
              loading={isStatsLoading}
            />
          </div>
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
                  size="sm"
                  variant="flat"
                  color="primary"
                  onPress={() => router.push('/admin/quotes')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {isQuotesLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Spinner />
                </div>
              ) : recentQuotes.length === 0 ? (
                <div className="text-muted-foreground flex h-40 flex-col items-center justify-center text-center">
                  <FileText className="text-muted-foreground/60 mb-2 h-8 w-8" />
                  <p>No quotes yet</p>
                  <p className="text-sm">Create your first quote to get started</p>
                  <Button
                    className="mt-4"
                    color="primary"
                    size="sm"
                    onPress={() => router.push('/admin/quotes/new')}
                  >
                    Create Quote
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-muted-foreground border-b text-left text-sm">
                        <th className="pb-2">Quote</th>
                        <th className="pb-2">Customer</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentQuotes.map((quote) => (
                        <tr
                          key={quote.id}
                          className="group hover:bg-muted/30 border-b"
                          onClick={() => router.push(`/admin/quotes/${quote.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="py-3 pr-4">
                            <div className="font-medium">{quote.title}</div>
                            <div className="text-muted-foreground text-xs">
                              #{quote.sequentialId}
                            </div>
                          </td>
                          <td className="py-3 pr-4">{quote.customerName}</td>
                          <td className="py-3 pr-4">{renderStatusChip(quote.status)}</td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-col">
                              <span className="text-xs">{formatDate(quote.date)}</span>
                              <span className="text-muted-foreground text-xs">
                                {formatRelativeTime(quote.date)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-right font-medium">
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
    </Layout>
  );
};

export default DashboardPage;
