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
import { formatCurrency, formatDate, formatUserFriendlyId, formatPercentage } from '~/utils/formatters';

// Type for the fetched quote data
type QuoteData = NonNullable<RouterOutputs['quote']['getById']>;
// Define type for a single material based on QuoteData
type MaterialItem = NonNullable<QuoteData['tasks'][number]['materials']>[number];

// Define QuoteStatusSettings locally or import if shared
const QuoteStatusSettings: Record<string, { color: 'default' | 'primary' | 'success' | 'danger'; labelKey: string }> = {
  DRAFT: { color: 'default', labelKey: 'quotes.status.draft' },
  SENT: { color: 'primary', labelKey: 'quotes.status.sent' },
  ACCEPTED: { color: 'success', labelKey: 'quotes.status.accepted' },
  REJECTED: { color: 'danger', labelKey: 'quotes.status.rejected' },
};

interface QuoteViewModalProps {
  quoteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuoteViewModal: React.FC<QuoteViewModalProps> = ({
  quoteId,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  // Fetch quote data
  const { data: quoteData, isLoading, isError } = api.quote.getById.useQuery(
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

  const handlePrint = () => {
    if (quoteId) {
      router.push(`/admin/quotes/${quoteId}/print`);
    }
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
            ? `${t('quotes.viewModalTitle')} ${formatUserFriendlyId(quoteData.id, quoteData.sequentialId)}`
            : t('quotes.viewModalTitle')}
        </ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
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
                  <h3 className="text-lg font-semibold mb-2">{t('quotes.detailsSectionTitle', { defaultValue: 'Details' })}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-sm text-gray-500">{t('quotes.titleLabel')}</p>
                      <p className="font-medium">{quoteData.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('quotes.customerLabel')}</p>
                      <p className="font-medium">{quoteData.customer?.name || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('common.status')}</p>
                      {(() => {
                        const statusKey = (quoteData.status ?? 'UNKNOWN').toUpperCase();
                        const setting = QuoteStatusSettings[statusKey] || { color: 'default', labelKey: 'common.unknown' };
                        return (
                          <Chip size="sm" color={setting.color}>
                            {t(setting.labelKey)}
                          </Chip>
                        );
                      })()}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('quotes.createdDateLabel')}</p>
                      <p className="font-medium">{formatDate(quoteData.createdAt)}</p>
                    </div>
                  </div>
                  {quoteData.notes && (
                    <>
                      <Divider className="my-3" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('quotes.notesLabel')}</p>
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
                  <h3 className="text-lg font-semibold mb-2">{t('quotes.tasksSectionTitle')}</h3>
                  {quoteData.tasks && quoteData.tasks.length > 0 ? (
                    <div className="space-y-4">
                      {quoteData.tasks.map((task: QuoteData['tasks'][number], index: number) => (
                        <div key={task.id || index} className="p-3 border rounded-md">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium">{task.description || t('common.noDescription')}</p>
                            <p className="font-medium text-right">{formatCurrency(task.price)}</p>
                          </div>
                          
                          {task.materialType === 'lumpsum' && (
                            <p className="text-sm text-gray-600 pl-2">
                              {t('quotes.materialTypeLumpSum')}: {formatCurrency(task.estimatedMaterialsCost ?? 0)}
                            </p>
                          )}

                          {task.materialType === 'itemized' && task.materials && task.materials.length > 0 && (
                            <div className="pl-2 mt-2">
                              <p className="text-sm font-medium mb-1">{t('quotes.materialsSectionTitle')}:</p>
                              <Table removeWrapper aria-label={`Materials for task ${index + 1}`}>
                                <TableHeader>
                                  {/* TODO: Add Product Name column later */}
                                  <TableColumn>{t('quotes.materialProductIdHeader')}</TableColumn>
                                  <TableColumn className="text-right">{t('quotes.materialQuantityHeader')}</TableColumn>
                                  <TableColumn className="text-right">{t('quotes.materialUnitPriceHeader')}</TableColumn>
                                  <TableColumn className="text-right">{t('quotes.materialLineTotalHeader')}</TableColumn>
                                </TableHeader>
                                <TableBody items={task.materials as MaterialItem[]}>
                                  {(material) => (
                                    <TableRow key={material.id}>
                                      <TableCell>{material.productId || t('common.notAvailable')}</TableCell>
                                      <TableCell className="text-right">{material.quantity}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(material.unitPrice)}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(material.quantity * material.unitPrice)}</TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                          {task.materialType === 'itemized' && (!task.materials || task.materials.length === 0) && (
                             <p className="text-sm text-gray-500 pl-2 italic">{t('quotes.noMaterialsForItemized')}</p>
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
                   <h3 className="text-lg font-semibold mb-2">{t('quoteSummary.title')}</h3>
                   <div className="space-y-2">
                     <div className="flex justify-between items-center">
                       <span className="text-gray-600">{t('quoteSummary.subtotalTasks')}</span>
                       <span className="font-medium">{formatCurrency(quoteData.subtotalTasks ?? 0)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-gray-600">{t('quoteSummary.subtotalMaterials')}</span>
                       <span className="font-medium">{formatCurrency(quoteData.subtotalMaterials ?? 0)}</span>
                     </div>
                     <div className="flex justify-between items-center border-t pt-2 mt-2">
                       <span className="text-gray-600 font-semibold">{t('quoteSummary.subtotalCombined')}</span>
                       <span className="font-semibold">{formatCurrency((quoteData.subtotalTasks ?? 0) + (quoteData.subtotalMaterials ?? 0))}</span>
                     </div>
                      {/* Display Markup if present */} 
                     {quoteData.markupCharge > 0 && (
                       <div className="flex justify-between items-center">
                         <span className="text-gray-600">{t('quoteSummary.markupCalculated')} ({formatPercentage(quoteData.markupPercentage)})</span>
                         <span className="font-medium">{formatCurrency(quoteData.markupCharge)}</span>
                       </div>
                     )}
                      {/* TODO: Add Tax display if applicable later */} 
                      {/* <div className="flex justify-between items-center">
                       <span className="text-gray-600">{t('quoteSummary.tax')} (Calculated %)</span>
                       <span className="font-medium">{formatCurrency(CALCULATED_TAX)}</span>
                     </div> */} 

                     <Divider className="my-2" />

                     <div className="flex justify-between items-center text-lg font-bold">
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
          <Button variant="ghost" onClick={onClose}>{
            t('common.close')
          }</Button>
          <Button 
            color="primary" 
            onClick={handlePrint} 
            disabled={isLoading || isError || !quoteData}
          >
            {t('common.print')} / {t('common.export')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 