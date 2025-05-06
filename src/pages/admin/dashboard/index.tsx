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
  LayoutGrid,
  LayoutList,
  TrendingUp,
  Activity,
  Calendar,
  BarChart2,
  Target,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Spinner,
  Button,
  Alert,
  ButtonGroup,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableCell,
  TableRow,
  Chip,
  Tabs,
  Tab,
} from '@heroui/react';
import { api } from '~/utils/api';
import { formatRelativeTime } from '~/utils/date';
import { useToastStore } from '~/store';
import { useCallback, useEffect, useState } from 'react';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '~/server/api/root';
import { withMainLayout } from '~/utils/withAuth';
import { routes } from '~/config/routes';
import { useTranslation } from '~/hooks/useTranslation';
import { APP_NAME } from '~/config/constants';
import { Breadcrumb } from '~/components/shared/Breadcrumb';
import Head from 'next/head';
import { useSession } from 'next-auth/react';

// Types
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  timeframe?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  goalPercentage?: number;
  loading?: boolean;
  error?: boolean;
}

interface QuickActionProps {
  title: string;
  icon: React.ReactNode;
  action: () => void;
}

interface QuoteItem {
  id: string;
  sequentialId: number;
  title: string;
  customer: {
    name: string;
  };
  status: string;
  date: Date;
  total: string;
}

const DashboardPage: NextPage = () => {
  const router = useRouter();
  const toast = useToastStore();
  const { t, formatCurrency } = useTranslation();
  const { data: session } = useSession();
  // Use local state for view mode management
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Default to grid view for mobile-friendliness

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
  const hasGrowthStats = (
    obj: typeof stats
  ): obj is typeof stats & {
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
    customer: quote.customer,
    status: quote.status,
    date: quote.createdAt,
    total: quote.grandTotal,
  })) as QuoteItem[];

  // Quick actions for the dashboard
  const quickActions: QuickActionProps[] = [
    {
      title: t('dashboard.quickActions.createQuote'),
      icon: <FileText className="h-4 w-4" />,
      action: () => router.push(routes.admin.quotes.new),
    },
    {
      title: t('dashboard.quickActions.addCustomer'),
      icon: <Users className="h-4 w-4" />,
      action: () => router.push(routes.admin.customers.new),
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
  const StatCard = ({
    title,
    value,
    icon,
    change,
    timeframe = 'from last month',
    subtitle,
    trend = 'neutral',
    goalPercentage,
    loading,
    error,
  }: StatCardProps) => (
    <Card className="h-full border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-800">
      <CardBody className="flex flex-col justify-between gap-2 p-3 sm:p-5">
        {loading ? (
          <div className="flex h-full items-center justify-center py-4">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-danger bg-danger-50/20 dark:bg-danger-900/20 flex flex-col items-center justify-center gap-2 rounded-lg py-5">
            <AlertTriangle className="h-7 w-7" />
            <span className="text-center text-sm font-medium">{t('common.error')}</span>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex-1">
                <span className="text-xs font-medium tracking-wide text-gray-500 uppercase sm:text-sm dark:text-gray-400">
                  {title}
                </span>
                {subtitle && (
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
                )}
              </div>
              <div
                className={`flex-shrink-0 rounded-full p-2 shadow-sm sm:p-3 ${
                  trend === 'up'
                    ? 'bg-success-50/80 dark:bg-success-900/20'
                    : trend === 'down'
                      ? 'bg-danger-50/80 dark:bg-danger-900/20'
                      : 'bg-primary-50/80 dark:bg-primary-900/20'
                } `}
              >
                {icon}
              </div>
            </div>

            <div className="text-xl font-bold text-gray-800 sm:text-3xl dark:text-gray-100">
              {value !== undefined && value !== null ? value : '—'}
            </div>

            <div className="mt-auto flex items-center justify-between">
              {change !== undefined && (
                <div className="mt-1 flex flex-wrap items-center gap-1 text-xs sm:text-sm">
                  {change >= 0 ? (
                    <div className="flex items-center gap-1">
                      <ArrowUp className="text-success h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                      <span className="text-success font-medium">{change}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <ArrowDown className="text-danger h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                      <span className="text-danger font-medium">{Math.abs(change)}%</span>
                    </div>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">{timeframe}</span>
                </div>
              )}

              {goalPercentage !== undefined && (
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="bg-primary-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, goalPercentage))}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Mini trend visualization */}
            {trend && (
              <div className="mt-1 flex items-center justify-end gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full ${
                      trend === 'up'
                        ? `w-${i + 1} bg-success-${200 + i * 100}`
                        : trend === 'down'
                          ? `w-${5 - i} bg-danger-${200 + i * 100}`
                          : `w-${2 + Math.abs(2 - i)} bg-gray-${200 + i * 100}`
                    } `}
                  ></div>
                ))}
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );

  return (
    <>
      <Head>
        <title>{t('dashboard.pageTitle')} | {APP_NAME}</title>
        <meta name="description" content={t('dashboard.welcome')} />
      </Head>

      <div className="p-1 sm:p-2 md:p-4">
        <div className="mb-4 sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-50">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.welcome')}</p>
        </div>

        {/* Stats Section */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('dashboard.overview.title')}
            </h2>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 items-center justify-center">
                <span className="bg-primary-400 absolute inline-flex h-2 w-2 animate-ping rounded-full opacity-75"></span>
                <span className="bg-primary-500 relative inline-flex h-2 w-2 rounded-full"></span>
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('dashboard.overview.liveData')}
              </span>
            </div>
          </div>

          {isStatsLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card
                  key={i}
                  className="h-[140px] border border-gray-100 shadow-sm sm:h-[160px] dark:border-gray-800"
                >
                  <CardBody className="flex h-full items-center justify-center bg-gray-50/30 dark:bg-gray-800/20">
                    <Spinner size="sm" />
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : statsError ? (
            <Alert variant="solid" color="danger" className="shadow-sm">
              <AlertCircle className="mr-2 h-5 w-5" />
              {statsError.message || t('common.error')}
            </Alert>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title={t('dashboard.stats.totalCustomers')}
                subtitle={t('dashboard.stats.totalCustomers.subtitle')}
                value={stats.totalCustomers}
                icon={<Users className="text-primary h-5 w-5" />}
                change={hasGrowthStats(stats) ? stats.customerGrowth : undefined}
                trend={hasGrowthStats(stats) && stats.customerGrowth >= 0 ? 'up' : 'down'}
                goalPercentage={75}
                loading={isStatsLoading}
                error={!!statsError}
              />
              <StatCard
                title={t('dashboard.stats.totalQuotes')}
                subtitle={t('dashboard.stats.totalQuotes.subtitle')}
                value={stats.totalQuotes}
                icon={<FileText className="text-success h-5 w-5" />}
                change={hasGrowthStats(stats) ? stats.quoteGrowth : undefined}
                trend={hasGrowthStats(stats) && stats.quoteGrowth >= 0 ? 'up' : 'down'}
                goalPercentage={85}
                timeframe={t('dashboard.stats.timeframe.thisMonth')}
                loading={isStatsLoading}
                error={!!statsError}
              />
              <StatCard
                title={t('dashboard.stats.productsUsed')}
                subtitle={t('dashboard.stats.productsUsed.subtitle')}
                value={hasGrowthStats(stats) ? stats.totalProducts : 0}
                icon={<Package className="text-warning h-5 w-5" />}
                change={hasGrowthStats(stats) ? stats.productGrowth : undefined}
                trend={hasGrowthStats(stats) && stats.productGrowth >= 0 ? 'up' : 'down'}
                goalPercentage={60}
                timeframe={t('dashboard.stats.timeframe.lastQuarter')}
                loading={isStatsLoading}
                error={!!statsError}
              />
              <StatCard
                title={t('dashboard.stats.revenue')}
                subtitle={t('dashboard.stats.revenue.subtitle')}
                value={formatCurrency(stats.totalRevenue)}
                icon={<DollarSign className="text-danger h-5 w-5" />}
                change={hasGrowthStats(stats) ? stats.revenueGrowth : undefined}
                trend={hasGrowthStats(stats) && stats.revenueGrowth >= 0 ? 'up' : 'down'}
                goalPercentage={90}
                timeframe={t('dashboard.stats.timeframe.vsTarget')}
                loading={isStatsLoading}
                error={!!statsError}
              />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-900 sm:mb-4 dark:text-white">
            {t('dashboard.quickActions.title')}
          </h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                color="primary"
                variant="flat"
                size="sm"
                startContent={action.icon}
                onPress={action.action}
                className="px-3 py-1 text-sm shadow-sm transition-all duration-200 hover:shadow-md sm:px-4 sm:py-2"
              >
                {action.title}
              </Button>
            ))}
            <Button
              color="primary"
              variant="flat"
              size="sm"
              startContent={<Package className="h-4 w-4" />}
              onPress={() => router.push(routes.admin.products.new)}
              className="px-3 py-1 text-sm shadow-sm transition-all duration-200 hover:shadow-md sm:px-4 sm:py-2"
            >
              {t('dashboard.quickActions.addProduct')}
            </Button>
          </div>
        </div>

        {/* Recent Quotes */}
        <div>
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('dashboard.recentQuotes.title')}
            </h2>
            <div className="flex items-center gap-2">
              {/* Replace Tabs with Buttons for View Mode Toggle */}
              <div className="flex items-center rounded-md border border-divider p-0.5">
                <Button
                  isIconOnly
                  size="sm"
                  variant={viewMode === 'grid' ? 'solid' : 'light'} // Indicate active state
                  onPress={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className="h-7 w-7 min-w-7 rounded-sm"
                >
                  <LayoutGrid size={14} />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant={viewMode === 'list' ? 'solid' : 'light'} // Indicate active state
                  onPress={() => setViewMode('list')}
                  aria-label="List view"
                  className="h-7 w-7 min-w-7 rounded-sm"
                >
                  <LayoutList size={14} />
                </Button>
              </div>

              <Button
                variant="light"
                color="primary"
                size="sm"
                endContent={<ArrowRight className="h-4 w-4" />}
                onPress={() => router.push(routes.admin.quotes.list)}
              >
                {t('dashboard.recentQuotes.viewAll')}
              </Button>
            </div>
          </div>
          <Card className="border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-800">
            <CardHeader className="p-5 pb-0">
              <div className="flex w-full items-center space-x-3">
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-primary-700 dark:text-primary-300 font-semibold">
                      {stats.acceptedQuotes}
                    </span>
                    <span className="text-sm whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {t('dashboard.recentQuotes.acceptedCount')}
                    </span>
                    <span className="bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400 rounded px-1 text-xs">
                      {Math.round((stats.acceptedQuotes / stats.totalQuotes) * 100) || 0}%{' '}
                      {t('dashboard.recentQuotes.conversionRate')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                    {formatCurrency(stats.totalRevenue)}{' '}
                    {t('dashboard.recentQuotes.revenueInfo', { count: stats.totalQuotes })}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-5">
              {isQuotesLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Spinner />
                </div>
              ) : recentQuotes.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-lg bg-gray-50 text-center dark:bg-gray-800/50">
                  <FileText className="text-primary h-10 w-10 opacity-70" />
                  <p className="text-base text-gray-500 dark:text-gray-400">
                    {t('dashboard.recentQuotes.noQuotes')}
                  </p>
                  <Button
                    color="primary"
                    startContent={<Plus className="h-4 w-4" />}
                    onPress={() => router.push(routes.admin.quotes.new)}
                    size="sm"
                    className="mt-2"
                  >
                    {t('dashboard.recentQuotes.newQuote')}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Table View */}
                  {viewMode === 'list' && (
                    <div className="overflow-x-auto">
                      <Table aria-label="Recent quotes">
                        <TableHeader>
                          <TableColumn>ID</TableColumn>
                          <TableColumn>{t('quotes.list.title')}</TableColumn>
                          <TableColumn>{t('quotes.list.customer')}</TableColumn>
                          <TableColumn>{t('quotes.list.status')}</TableColumn>
                          <TableColumn>{t('quotes.list.total')}</TableColumn>
                          <TableColumn>{t('common.actions')}</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {recentQuotes.map((quote) => (
                            <TableRow
                              key={quote.id}
                              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              onClick={() => router.push(routes.admin.quotes.detail(quote.id))}
                            >
                              <TableCell>#{quote.sequentialId}</TableCell>
                              <TableCell>{quote.title}</TableCell>
                              <TableCell>{quote.customer.name}</TableCell>
                              <TableCell>{renderStatusChip(quote.status)}</TableCell>
                              <TableCell>{formatCurrency(Number(quote.total))}</TableCell>
                              <TableCell>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  onPress={() => router.push(routes.admin.quotes.detail(quote.id))}
                                  aria-label={t('common.view')}
                                >
                                  <ArrowRight size={16} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Grid View */}
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {recentQuotes.map((quote) => (
                        <Card
                          key={quote.id}
                          className="cursor-pointer transition-all duration-200 hover:shadow-md"
                          onPress={() => router.push(routes.admin.quotes.detail(quote.id))}
                        >
                          <CardBody className="p-4">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">#{quote.sequentialId}</span>
                                {renderStatusChip(quote.status)}
                              </div>

                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                                  {quote.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {quote.customer.name}
                                </p>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                                  {formatCurrency(Number(quote.total))}
                                </span>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  onPress={() => router.push(routes.admin.quotes.detail(quote.id))}
                                  aria-label={t('common.view')}
                                >
                                  <ArrowRight size={16} />
                                </Button>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
};

export default withMainLayout(DashboardPage);
