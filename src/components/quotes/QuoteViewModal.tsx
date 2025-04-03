'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Card,
  CardBody,
  Divider,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from '@heroui/react';
import { api, type RouterOutputs } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import type { TranslationKey } from '~/types/i18n/keys';
import type { QuoteStatusType } from '~/server/db/schema-exports';

// Type for the fetched quote data
type QuoteData = NonNullable<RouterOutputs['quote']['getById']>;
// Define type for a single material based on QuoteData
type MaterialItem = NonNullable<QuoteData['tasks'][number]['materials']>[number];

// Define QuoteStatusSettings locally or import if shared
const QuoteStatusSettings: Record<
  QuoteStatusType | 'UNKNOWN',
  { color: 'default' | 'primary' | 'success' | 'danger'; labelKey: TranslationKey }
> = {
  DRAFT: { color: 'default', labelKey: 'quotes.status.draft' },
  SENT: { color: 'primary', labelKey: 'quotes.status.sent' },
  ACCEPTED: { color: 'success', labelKey: 'quotes.status.accepted' },
  REJECTED: { color: 'danger', labelKey: 'quotes.status.rejected' },
  UNKNOWN: { color: 'default', labelKey: 'common.unknown' },
};

interface QuoteViewModalProps {
  quoteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuoteViewModal: React.FC<QuoteViewModalProps> = ({ quoteId, isOpen, onClose }) => {
  const { t, formatCurrency, formatDate } = useTranslation();
  const router = useRouter();

  // Fetch quote data
  const {
    data: quoteData,
    isLoading,
    isError,
  } = api.quote.getById.useQuery(
    {
      id: quoteId!,
      // includeRelated: true // Removed - Input schema doesn't support this
    },
    {
      enabled: !!quoteId && isOpen, // Only fetch if quoteId is provided and modal is open
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const formatUserFriendlyId = (uuid: string, sequentialId: number | null): string => {
    const shortUuid = uuid.substring(0, 8);
    return sequentialId ? `#${sequentialId} (${shortUuid})` : uuid;
  };

  const handlePrint = () => {
    if (quoteId) {
      router.push(`/admin/quotes/${quoteId}/print`);
    }
  };

  const toNumber = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  return (
    <Modal size="4xl" isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          {isLoading
            ? t('common.loading')
            : isError
              ? t('common.error')
              : quoteData
                ? t('quotes.viewModalTitle', {
                    id: formatUserFriendlyId(quoteData.id, quoteData.sequentialId),
                  })
                : t('quotes.viewModalTitle')}
        </ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner label={t('common.loading')} />
            </div>
          ) : isError ? (
            <p className="text-danger">{t('quotes.loadError')}</p>
          ) : quoteData ? (
            // Render read-only quote details
            <div className="space-y-4">
              {/* Basic Info Card */}
              <Card>
                <CardBody>
                  <h3 className="mb-2 text-lg font-semibold">{t('quotes.detailsSectionTitle')}</h3>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-500">{t('quotes.titleLabel')}</p>
                      <p className="font-medium">{quoteData.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('quotes.customerLabel')}</p>
                      <p className="font-medium">
                        {quoteData.customer?.name || t('common.notAvailable')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('common.status')}</p>
                      {(() => {
                        const statusKey = quoteData.status ?? 'UNKNOWN';
                        const setting = QuoteStatusSettings[statusKey];
                        if (!setting) {
                          return <span className="text-sm text-gray-500">{t('common.unknown')}</span>;
                        }
                        return (
                          <Chip size="sm" color={setting.color}>
                            {t(setting.labelKey)}
                          </Chip>
                        );
                      })()}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('quotes.createdDateLabel')}</p>
                      <p className="font-medium">{formatDate(quoteData.createdAt, 'long')}</p>
                    </div>
                  </div>
                  {quoteData.notes && (
                    <>
                      <Divider className="my-3" />
                      <div>
                        <p className="mb-1 text-sm text-gray-500">{t('quotes.notesLabel')}</p>
                        {/* Display notes, consider formatting if needed */}
                        <p className="text-sm whitespace-pre-wrap">{quoteData.notes}</p>
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>

              {/* Tasks/Materials Card */}
              <Card>
                <CardBody>
                  <h3 className="mb-2 text-lg font-semibold">{t('quotes.tasksSectionTitle')}</h3>
                  {quoteData.tasks && quoteData.tasks.length > 0 ? (
                    <div className="space-y-4">
                      {quoteData.tasks.map((task: QuoteData['tasks'][number], index: number) => (
                        <div key={task.id || index} className="rounded-md border p-3">
                          <div className="mb-2 flex items-start justify-between">
                            <p className="font-medium">
                              {task.description || t('common.noDescription')}
                            </p>
                            <p className="text-right font-medium">{formatCurrency(task.price)}</p>
                          </div>

                          {task.materialType === 'LUMPSUM' && (
                            <p className="pl-2 text-sm text-gray-600">
                              {t('quotes.materialTypeLumpSum')}:{' '}
                              {formatCurrency(task.estimatedMaterialsCost ?? 0)}
                            </p>
                          )}

                          {task.materialType === 'ITEMIZED' &&
                            task.materials &&
                            task.materials.length > 0 && (
                              <div className="mt-2 pl-2">
                                <p className="mb-1 text-sm font-medium">
                                  {t('quotes.materialsSectionTitle')}:
                                </p>
                                <Table removeWrapper aria-label={`Materials for task ${index + 1}`}>
                                  <TableHeader>
                                    {/* TODO: Add Product Name column later */}
                                    <TableColumn>{t('quotes.materialProductIdHeader')}</TableColumn>
                                    <TableColumn className="text-right">
                                      {t('quotes.materialQuantityHeader')}
                                    </TableColumn>
                                    <TableColumn className="text-right">
                                      {t('quotes.materialUnitPriceHeader')}
                                    </TableColumn>
                                    <TableColumn className="text-right">
                                      {t('quotes.materialLineTotalHeader')}
                                    </TableColumn>
                                  </TableHeader>
                                  <TableBody items={task.materials as MaterialItem[]}>
                                    {(material) => (
                                      <TableRow key={material.id}>
                                        <TableCell>
                                          {material.productId || t('common.notAvailable')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {material.quantity}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {formatCurrency(toNumber(material.unitPrice))}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {formatCurrency(
                                            (material.quantity ?? 0) * toNumber(material.unitPrice)
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          {task.materialType === 'ITEMIZED' &&
                            (!task.materials || task.materials.length === 0) && (
                              <p className="pl-2 text-sm text-gray-500 italic">
                                {t('quotes.noMaterialsForItemized')}
                              </p>
                            )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">{t('quotes.noTasksAdded')}</p>
                  )}
                </CardBody>
              </Card>

              {/* Quote Summary Card */}
              <Card>
                <CardBody>
                  <h3 className="mb-2 text-lg font-semibold">{t('quoteSummary.title')}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t('quoteSummary.subtotalTasks')}</span>
                      <span className="font-medium">{formatCurrency(quoteData.subtotalTasks)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t('quoteSummary.subtotalMaterials')}</span>
                      <span className="font-medium">
                        {formatCurrency(quoteData.subtotalMaterials)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t pt-2">
                      <span className="font-semibold text-gray-600">
                        {t('quoteSummary.subtotalCombined')}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(
                          (quoteData.subtotalTasks ?? 0) + (quoteData.subtotalMaterials ?? 0)
                        )}
                      </span>
                    </div>
                    {/* Display Markup if present */}
                    {quoteData.markupCharge > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">
                          {t('quoteSummary.markupCalculated')} (
                          {quoteData.markupPercentage?.toFixed(1)}%)
                        </span>
                        <span className="font-medium">
                          {formatCurrency(quoteData.markupCharge)}
                        </span>
                      </div>
                    )}
                    {/* TODO: Add Tax display if applicable later */}
                    {/* <div className="flex justify-between items-center">
                       <span className="text-gray-600">{t('quoteSummary.tax')} (Calculated %)</span>
                       <span className="font-medium">{formatCurrency(CALCULATED_TAX)}</span>
                     </div> */}

                    <Divider className="my-2" />

                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>{t('quoteSummary.grandTotal')}</span>
                      <span>{formatCurrency(quoteData.grandTotal ?? 0)}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          ) : (
            <p>{t('common.noDataAvailable')}</p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onPress={onClose}>
            {t('common.close')}
          </Button>
          <Button
            color="primary"
            onPress={handlePrint}
            disabled={isLoading || isError || !quoteData}
          >
            {t('common.print')} / {t('common.export')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
