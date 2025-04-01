import React from 'react';
import { Card, CardBody, CardHeader, NumberInput } from '@heroui/react';
import { useTranslation } from '~/hooks/useTranslation';
import { formatCurrency } from '~/utils/formatters';

interface QuoteSummaryProps {
  subtotalTasks: number;
  subtotalMaterials: number;
  markupPercentage: number | undefined;
  markupCharge: number;
  tax: number;
  grandTotal: number;
  onMarkupChange: (value: number) => void;
  readOnly?: boolean;
}

/**
 * Component for displaying the quote summary with detailed breakdown
 */
export const QuoteSummary: React.FC<QuoteSummaryProps> = ({
  subtotalTasks,
  subtotalMaterials,
  markupPercentage,
  markupCharge,
  tax,
  grandTotal,
  onMarkupChange,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  
  // Calculate combined subtotal for display
  const subtotal = subtotalTasks + subtotalMaterials;
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <h2 className="text-xl font-semibold">{t('quoteSummary.title', { defaultValue: 'Quote Summary' })}</h2>
      </CardHeader>
      
      <CardBody>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t('quoteSummary.subtotalTasks', { defaultValue: 'Subtotal (Tasks):' })}</span>
            <span className="font-medium">{formatCurrency(subtotalTasks)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t('quoteSummary.subtotalMaterials', { defaultValue: 'Subtotal (Materials):' })}</span>
            <span className="font-medium">{formatCurrency(subtotalMaterials)}</span>
          </div>
          
          <div className="flex justify-between items-center border-t pt-2 mt-2">
            <span className="text-gray-600 font-semibold">{t('quoteSummary.subtotalCombined', { defaultValue: 'Subtotal (Combined):' })}</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">{t('quoteSummary.markup', { defaultValue: 'Markup (%):' })}</span>
              <NumberInput
                aria-label={t('quoteSummary.markupInputLabel', { defaultValue: 'Markup Percentage' })}
                value={markupPercentage}
                onChange={onMarkupChange as any}
                min={0}
                step={0.1}
                formatOptions={{ style: 'decimal', minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                endContent="%"
                className="w-24"
                isReadOnly={readOnly}
                isDisabled={readOnly}
              />
            </div>
            <span className="font-medium">{formatCurrency(markupCharge)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t('quoteSummary.tax', { defaultValue: 'Tax (7%):' })}</span>
            <span className="font-medium">{formatCurrency(tax)}</span>
          </div>
          
          <div className="h-px bg-gray-200 my-2"></div>
          
          <div className="flex justify-between items-center text-lg font-bold">
            <span>{t('quoteSummary.grandTotal', { defaultValue: 'Grand Total:' })}</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
