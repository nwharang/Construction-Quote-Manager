import { useRouter } from 'next/router';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Spinner,
  Divider,
  Progress,
  Badge,
  Accordion,
  AccordionItem,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
} from '@heroui/react';
import {
  ArrowLeft,
  Edit,
  Trash,
  Printer,
  ChevronDown,
  DollarSign,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Hammer,
  Package,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';
import { api } from '~/utils/api';
import { withMainLayout } from '~/utils/withAuth';
import { useAppToast } from '~/components/providers/ToastProvider';
import { DeleteEntityDialog } from '~/components/shared/DeleteEntityDialog';
import { ResponsiveButton } from '~/components/ui/ResponsiveButton';
import { useState } from 'react';
import { routes } from '~/config/routes';
import { QuoteStatusBadge } from '~/components/quotes/QuoteStatusBadge';
import Head from 'next/head';
import { APP_NAME } from '~/config/constants';
import { QuoteStatus } from '~/server/db/schema';
import { useI18n } from '~/components/providers/I18nProvider';

function QuoteDetailContent() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { t, formatDate, formatCurrency } = useTranslation();
  const { currentLocale } = useI18n();
  const toast = useAppToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);

  const {
    data: quote,
    isLoading,
    refetch,
  } = api.quote.getById.useQuery(
    { id },
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  );

  const { mutate: deleteQuote } = api.quote.delete.useMutation({
    onSuccess: () => {
      toast.success('Quote deleted successfully');
      router.push(routes.admin.quotes.list);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete quote');
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const { mutate: updateStatus, isPending: isStatusUpdating } = api.quote.updateStatus.useMutation({
    onSuccess: () => {
      toast.success(t('quotes.statusChange.success'));
      setIsStatusChangeModalOpen(false);
      void refetch();
    },
    onError: (error) => {
      toast.error(t('quotes.statusChange.error', { message: error.message }));
    },
  });

  const handleDelete = async (): Promise<void> => {
    if (id) {
      setIsDeleting(true);
      return new Promise<void>((resolve) => {
        deleteQuote({ id });
        resolve();
      });
    }
    return Promise.resolve();
  };

  const handleEdit = () => {
    router.push(routes.admin.quotes.edit(id));
  };

  const handlePrint = () => {
    router.push(routes.admin.quotes.print(id));
  };

  const toggleTaskExpand = (taskId: string) => {
    if (expandedTask === taskId) {
      setExpandedTask(null);
    } else {
      setExpandedTask(taskId);
    }
  };

  const openStatusChangeModal = () => {
    if (quote) {
      setNewStatus(quote.status);
      setIsStatusChangeModalOpen(true);
    }
  };

  const handleStatusChange = () => {
    if (quote && newStatus && newStatus !== quote.status) {
      updateStatus({
        id: quote.id,
        status: newStatus as keyof typeof QuoteStatus,
      });
    } else {
      setIsStatusChangeModalOpen(false);
    }
  };

  // Calculate task totals for display
  const getTaskTotal = (task: any): number => {
    const laborCost =
      typeof task.price === 'number' ? task.price : parseFloat(String(task.price) || '0');

    let materialsCost = 0;
    if (task.materialType === 'LUMPSUM' && task.estimatedMaterialsCostLumpSum) {
      materialsCost =
        typeof task.estimatedMaterialsCostLumpSum === 'number'
          ? task.estimatedMaterialsCostLumpSum
          : parseFloat(String(task.estimatedMaterialsCostLumpSum) || '0');
    } else if (task.materialType === 'ITEMIZED' && task.materials && task.materials.length > 0) {
      materialsCost = task.materials.reduce((sum: number, material: any) => {
        const quantity =
          typeof material.quantity === 'number'
            ? material.quantity
            : parseFloat(String(material.quantity) || '0');
        const unitPrice =
          typeof material.unitPrice === 'number'
            ? material.unitPrice
            : parseFloat(String(material.unitPrice) || '0');
        return sum + quantity * unitPrice;
      }, 0);
    }

    return laborCost + materialsCost;
  };

  // Calculate detailed totals and percentages
  const calculateTotals = () => {
    if (!quote || !quote.tasks) return null;

    const laborTotal = quote.tasks.reduce(
      (total, task) => total + parseFloat(String(task.price) || '0'),
      0
    );

    let materialsTotal = 0;
    quote.tasks.forEach((task) => {
      if (task.materialType === 'LUMPSUM' && task.estimatedMaterialsCostLumpSum) {
        materialsTotal += parseFloat(String(task.estimatedMaterialsCostLumpSum) || '0');
      } else if (task.materialType === 'ITEMIZED' && task.materials && task.materials.length > 0) {
        task.materials.forEach((material) => {
          materialsTotal +=
            parseFloat(String(material.quantity) || '0') *
            parseFloat(String(material.unitPrice) || '0');
        });
      }
    });

    const subtotal = laborTotal + materialsTotal;
    const markupAmount = subtotal * quote.markupPercentage;
    const grandTotal = subtotal + markupAmount;

    const laborPercentage = (laborTotal / grandTotal) * 100;
    const materialsPercentage = (materialsTotal / grandTotal) * 100;
    const markupPercentage = (markupAmount / grandTotal) * 100;

    return {
      laborTotal,
      materialsTotal,
      subtotal,
      markupAmount,
      grandTotal,
      laborPercentage,
      materialsPercentage,
      markupPercentage,
    };
  };

  const totals = calculateTotals();

  const getStatusDetails = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return {
          icon: <Clock className="mr-2" size={16} />,
          description:
            "This quote is still in draft mode and hasn't been sent to the customer yet.",
        };
      case 'sent':
        return {
          icon: <Calendar className="mr-2" size={16} />,
          description: 'This quote has been sent to the customer and is awaiting their response.',
        };
      case 'accepted':
        return {
          icon: <CheckCircle className="mr-2" size={16} />,
          description: 'Great news! The customer has accepted this quote.',
        };
      case 'rejected':
        return {
          icon: <AlertCircle className="mr-2" size={16} />,
          description:
            'The customer has rejected this quote. Consider following up to understand why.',
        };
      default:
        return {
          icon: <Clock className="mr-2" size={16} />,
          description: 'Current status of this quote.',
        };
    }
  };

  // Dynamic title based on quote data
  const pageTitle = quote
    ? `${t('quotes.view.pageTitle')} #${quote.sequentialId || quote.id.substring(0, 6)} | ${APP_NAME}`
    : `Quote | ${APP_NAME}`;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not found state
  if (!quote) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">{t('quotes.view.notFound')}</h2>
        <Button
          color="primary"
          variant="light"
          className="mt-4"
          startContent={<ArrowLeft size={16} />}
          onClick={() => router.push(routes.admin.quotes.list)}
        >
          {t('quotes.view.backToQuotes')}
        </Button>
      </div>
    );
  }

  const statusDetails = getStatusDetails(quote.status);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        {/* Optionally add description meta tag */}
        {/* <meta name="description" content={...} /> */}
      </Head>

      <div className="space-y-6">
        {/* Breadcrumb and Actions */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Button
              variant="light"
              className="mb-4"
              startContent={<ArrowLeft size={16} />}
              onClick={() => router.push(routes.admin.quotes.list)}
            >
              {t('quotes.view.backToQuotes')}
            </Button>
          </div>
          <div className="ml-auto flex gap-2">
            <ResponsiveButton
              color="primary"
              variant="flat"
              icon={<RefreshCw size={16} />}
              label={t('quotes.view.changeStatus')}
              onClick={openStatusChangeModal}
            />
            <ResponsiveButton
              color="primary"
              variant="flat"
              icon={<Printer size={16} />}
              label={t('common.print')}
              onClick={handlePrint}
            />
            <ResponsiveButton
              color="primary"
              variant="flat"
              icon={<Edit size={16} />}
              label={t('common.edit')}
              onClick={handleEdit}
            />
            <ResponsiveButton
              color="danger"
              variant="flat"
              icon={<Trash size={16} />}
              label={t('common.delete')}
              onClick={() => setIsDeleteDialogOpen(true)}
            />
          </div>
        </div>

        {/* Quote Details Card */}
        <Card className="shadow-md transition-shadow duration-300 hover:shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold">
                {quote.title || `Quote #${quote.sequentialId || quote.id.substring(0, 8)}`}
              </h2>
              <div className="flex items-center gap-2">
                <QuoteStatusBadge status={quote.status} size="md" />
                <Tooltip content={statusDetails.description}>
                  <div className="ml-2 flex items-center border-l pl-2 text-sm text-gray-600 dark:text-gray-300">
                    {statusDetails.icon}
                    <span>{quote.status}</span>
                  </div>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Customer Information */}
              <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <CardBody>
                  <h3 className="mb-3 flex items-center text-lg font-semibold">
                    <svg
                      className="mr-2 h-5 w-5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {t('quotes.view.customerInfo')}
                  </h3>
                  {quote.customer ? (
                    <dl className="space-y-3 text-sm">
                      {/* Name */}
                      <div className="grid grid-cols-3 gap-1">
                        <dt className="font-medium text-gray-600 dark:text-gray-400">{t('quotes.view.customerNameLabel')}</dt>
                        <dd className="col-span-2 font-medium">{quote.customer.name || '-'}</dd>
                      </div>
                      {/* Email */}
                      <div className="grid grid-cols-3 gap-1">
                         <dt className="font-medium text-gray-600 dark:text-gray-400">{t('quotes.view.customerEmailLabel')}</dt>
                         <dd className="col-span-2">{quote.customer.email || '-'}</dd>
                      </div>
                      {/* Phone */}
                      <div className="grid grid-cols-3 gap-1">
                         <dt className="font-medium text-gray-600 dark:text-gray-400">{t('quotes.view.customerPhoneLabel')}</dt>
                         <dd className="col-span-2">{quote.customer.phone || '-'}</dd>
                      </div>
                      {/* Address */}
                      <div className="grid grid-cols-3 gap-1">
                         <dt className="font-medium text-gray-600 dark:text-gray-400">{t('quotes.view.customerAddressLabel')}</dt>
                         <dd className="col-span-2 whitespace-pre-line">{quote.customer.address || '-'}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-gray-500">{t('quotes.view.customerNotAvailable')}</p>
                  )}
                </CardBody>
              </Card>

              {/* Quote Information */}
              <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <CardHeader>
                  <h3 className="flex items-center text-lg font-semibold">
                    <FileText className="mr-2 text-green-500" size={20} />
                    {t('quotes.view.quoteSummary')}
                  </h3>
                </CardHeader>
                <CardBody>
                  <dl className="space-y-3">
                    {/* Created/Updated Dates */}
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>{t('quotes.view.createdOn')}</span>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        <span>{formatDate(quote.createdAt)}</span>
                      </dd>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>{t('quotes.view.lastUpdated')}</span>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        <span>{formatDate(quote.updatedAt)}</span>
                      </dd>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>{t('quotes.view.markup')}</span>
                      <span>{quote.markupPercentage * 100}%</span>
                    </div>

                    {totals && (
                      <div className="mt-4 border-t pt-4">
                        <div className="flex justify-between py-1 text-gray-700 dark:text-gray-300">
                          <span>{t('quotes.view.subtotal')}:</span>
                          <span>{formatCurrency(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between py-1 text-gray-700 dark:text-gray-300">
                          <span>
                            {t('quotes.summary.markupCalculated')} ({quote.markupPercentage}%)
                          </span>
                          <span>{formatCurrency(totals.markupAmount)}</span>
                        </div>
                        <div className="mt-2 flex justify-between py-1 text-lg font-bold">
                          <span>{t('quotes.view.grandTotal')}</span>
                          <span>{formatCurrency(totals.grandTotal)}</span>
                        </div>
                      </div>
                    )}
                  </dl>
                </CardBody>
              </Card>
            </div>

            {/* Cost Breakdown */}
            {totals && (
              <>
                <Divider className="my-6" />
                <div>
                  <h3 className="mb-4 flex items-center text-lg font-semibold">
                    <svg
                      className="mr-2 h-5 w-5 text-purple-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    {t('quotes.view.costBreakdown')}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card className="border border-blue-100 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                      <CardBody>
                        <h4 className="mb-1 text-sm text-blue-700 dark:text-blue-300">
                          {t('quotes.view.labor')}
                        </h4>
                        <p className="text-lg font-bold">{formatCurrency(totals.laborTotal)}</p>
                        <div className="mt-2">
                          <div className="mb-1 flex justify-between text-xs">
                            <span>
                              {Math.round(totals.laborPercentage)}%{' '}
                              {t('quotes.view.percentOfTotal')}
                            </span>
                          </div>
                          <Progress
                            value={totals.laborPercentage}
                            color="primary"
                            aria-label="Labor percentage"
                            className="h-2"
                          />
                        </div>
                      </CardBody>
                    </Card>

                    <Card className="border border-green-100 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                      <CardBody>
                        <h4 className="mb-1 text-sm text-green-700 dark:text-green-300">
                          {t('quotes.view.materials')}
                        </h4>
                        <p className="text-lg font-bold">{formatCurrency(totals.materialsTotal)}</p>
                        <div className="mt-2">
                          <div className="mb-1 flex justify-between text-xs">
                            <span>
                              {Math.round(totals.materialsPercentage)}%{' '}
                              {t('quotes.view.percentOfTotal')}
                            </span>
                          </div>
                          <Progress
                            value={totals.materialsPercentage}
                            color="success"
                            aria-label="Materials percentage"
                            className="h-2"
                          />
                        </div>
                      </CardBody>
                    </Card>

                    <Card className="border border-amber-100 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                      <CardBody>
                        <h4 className="mb-1 text-sm text-amber-700 dark:text-amber-300">
                          {t('quotes.summary.markupCalculated')}
                        </h4>
                        <p className="text-lg font-bold">{formatCurrency(totals.markupAmount)}</p>
                        <div className="mt-2">
                          <div className="mb-1 flex justify-between text-xs">
                            <span>
                              {Math.round(totals.markupPercentage)}%{' '}
                              {t('quotes.view.percentOfTotal')}
                            </span>
                          </div>
                          <Progress
                            value={totals.markupPercentage}
                            color="warning"
                            aria-label="Markup percentage"
                            className="h-2"
                          />
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              </>
            )}

            {/* Notes Section */}
            {quote.notes && (
              <>
                <Divider className="my-6" />
                <div>
                  <h3 className="mb-2 flex items-center text-lg font-semibold">
                    <svg
                      className="mr-2 h-5 w-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    {t('quotes.view.notes')}
                  </h3>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p className="whitespace-pre-wrap">{quote.notes}</p>
                  </div>
                </div>
              </>
            )}

            {/* Tasks Section */}
            <Divider className="my-6" />
            <div>
              <h3 className="mb-4 flex items-center text-lg font-semibold">
                <Hammer className="mr-2 text-orange-500" size={20} />
                {t('quotes.view.tasks')}
              </h3>
              {quote.tasks && quote.tasks.length > 0 ? (
                <div className="mt-3 space-y-4">
                  {quote.tasks.map((task) => {
                    const taskTotal = getTaskTotal(task);
                    const isExpanded = expandedTask === task.id;

                    // Calculate labor and materials percentage for this task
                    const laborCost = parseFloat(String(task.price) || '0');
                    let materialsCost = 0;

                    if (task.materialType === 'LUMPSUM' && task.estimatedMaterialsCostLumpSum) {
                      materialsCost = parseFloat(String(task.estimatedMaterialsCostLumpSum) || '0');
                    } else if (
                      task.materialType === 'ITEMIZED' &&
                      task.materials &&
                      task.materials.length > 0
                    ) {
                      materialsCost = task.materials.reduce((sum, material) => {
                        return (
                          sum +
                          parseFloat(String(material.quantity) || '0') *
                            parseFloat(String(material.unitPrice) || '0')
                        );
                      }, 0);
                    }

                    const laborPercent = (laborCost / taskTotal) * 100;
                    const materialsPercent = (materialsCost / taskTotal) * 100;

                    return (
                      <Card
                        key={task.id}
                        className={`border border-gray-200 transition-all duration-300 dark:border-gray-700 ${
                          isExpanded ? 'shadow-md' : 'hover:shadow-sm'
                        }`}
                      >
                        <CardBody className="p-4">
                          <div
                            className="flex cursor-pointer justify-between"
                            onClick={() => toggleTaskExpand(task.id)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center">
                                <ChevronDown
                                  size={16}
                                  className={`mr-2 transition-transform duration-300 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                                <h4 className="font-medium">{task.description}</h4>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <Badge color="default" variant="flat" className="hidden md:flex">
                                {task.materialType === 'LUMPSUM'
                                  ? t('quotes.view.lumpSum')
                                  : t('quotes.view.itemized')}
                              </Badge>
                              <div className="text-right">
                                <span className="font-semibold">{formatCurrency(taskTotal)}</span>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                  <h5 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('quotes.view.taskDetails')}
                                  </h5>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span>{t('quotes.view.labor')}:</span>
                                      <span>{formatCurrency(laborCost)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>{t('quotes.view.materials')}:</span>
                                      <span>{formatCurrency(materialsCost)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                      <span>{t('quotes.view.total')}:</span>
                                      <span>{formatCurrency(taskTotal)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h5 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('quotes.view.costDistribution')}
                                  </h5>
                                  <div className="space-y-3">
                                    <div>
                                      <div className="mb-1 flex justify-between text-xs">
                                        <span>{t('quotes.view.labor')}</span>
                                        <span>{Math.round(laborPercent)}%</span>
                                      </div>
                                      <Progress
                                        value={laborPercent}
                                        color="primary"
                                        className="h-2"
                                      />
                                    </div>
                                    <div>
                                      <div className="mb-1 flex justify-between text-xs">
                                        <span>{t('quotes.view.materials')}</span>
                                        <span>{Math.round(materialsPercent)}%</span>
                                      </div>
                                      <Progress
                                        value={materialsPercent}
                                        color="success"
                                        className="h-2"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {task.materialType === 'ITEMIZED' &&
                                task.materials &&
                                task.materials.length > 0 && (
                                  <div className="mt-4">
                                    <h5 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {t('quotes.view.materials')}
                                    </h5>
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                          <thead>
                                            <tr className="border-b text-xs text-gray-500 dark:text-gray-400">
                                              <th className="pb-2 text-left">
                                                {t('quotes.view.item')}
                                              </th>
                                              <th className="pb-2 text-right">
                                                {t('quotes.view.quantity')}
                                              </th>
                                              <th className="pb-2 text-right">
                                                {t('quotes.view.unitPrice')}
                                              </th>
                                              <th className="pb-2 text-right">
                                                {t('quotes.view.total')}
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {task.materials.map((material, idx) => {
                                              const quantity = parseFloat(
                                                String(material.quantity) || '0'
                                              );
                                              const unitPrice = parseFloat(
                                                String(material.unitPrice) || '0'
                                              );
                                              const total = quantity * unitPrice;

                                              return (
                                                <tr
                                                  key={idx}
                                                  className="border-b border-gray-100 text-sm last:border-0 dark:border-gray-700"
                                                >
                                                  <td className="py-2">
                                                    {material.productName || 'Unknown Product'}
                                                  </td>
                                                  <td className="py-2 text-right">{quantity}</td>
                                                  <td className="py-2 text-right">
                                                    {formatCurrency(unitPrice)}
                                                  </td>
                                                  <td className="py-2 text-right font-medium">
                                                    {formatCurrency(total)}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                )}

                              {task.materialType === 'LUMPSUM' &&
                                task.estimatedMaterialsCostLumpSum && (
                                  <div className="mt-4">
                                    <h5 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {t('quotes.view.materialsLumpSum')}
                                    </h5>
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                                      <p className="font-medium">{formatCurrency(materialsCost)}</p>
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">{t('quotes.view.noTasks')}</p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Status Change Modal */}
        <Modal isOpen={isStatusChangeModalOpen} onClose={() => setIsStatusChangeModalOpen(false)}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {t('quotes.statusChange.title')}
                </ModalHeader>
                <ModalBody>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="mb-1 text-sm text-gray-500">
                        {t('quotes.statusChange.current')}
                      </p>
                      <QuoteStatusBadge status={quote.status} size="md" />
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-gray-500">{t('quotes.statusChange.new')}</p>
                      <Select
                        aria-label="Status"
                        value={newStatus || quote.status}
                        onChange={(e) => setNewStatus(e.target.value)}
                        defaultSelectedKeys={[quote.status]}
                      >
                        <SelectItem key="DRAFT" textValue="DRAFT">
                          {t('quotes.status.draft')}
                        </SelectItem>
                        <SelectItem key="SENT" textValue="SENT">
                          {t('quotes.status.sent')}
                        </SelectItem>
                        <SelectItem key="ACCEPTED" textValue="ACCEPTED">
                          {t('quotes.status.accepted')}
                        </SelectItem>
                        <SelectItem key="REJECTED" textValue="REJECTED">
                          {t('quotes.status.rejected')}
                        </SelectItem>
                      </Select>
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="flat" onPress={onClose}>
                    {t('quotes.statusChange.cancel')}
                  </Button>
                  <Button color="primary" onPress={handleStatusChange} isLoading={isStatusUpdating}>
                    {t('quotes.statusChange.submit')}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <DeleteEntityDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          isLoading={isDeleting}
          entityName={t('quotes.entityName')}
          entityLabel={quote.title || `#${quote.sequentialId || quote.id.substring(0, 8)}`}
        />
      </div>
    </>
  );
}

export default withMainLayout(QuoteDetailContent);
