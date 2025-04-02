import React from 'react';
import { Card, CardBody, CardHeader, NumberInput } from '@heroui/react';
import { useTranslation } from '~/hooks/useTranslation';

interface QuoteSummaryProps {
  subtotalTasks: number;
  subtotalMaterials: number;
  markupPercentage: number | undefined;
  markupCharge: number;
  tax: number;
  grandTotal: number;
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
  readOnly = false,
}) => {
  const { t, formatCurrency } = useTranslation();

  // Calculate combined subtotal for display
  const subtotal = subtotalTasks + subtotalMaterials;

  return (
    <Card className="mb-6">
      <CardHeader>
        <h2 className="text-xl font-semibold">{t('quoteSummary.title')}</h2>
      </CardHeader>

      <CardBody>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{t('quoteSummary.subtotalTasks')}</span>
            <span className="font-medium">{formatCurrency(subtotalTasks)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">{t('quoteSummary.subtotalMaterials')}</span>
            <span className="font-medium">{formatCurrency(subtotalMaterials)}</span>
          </div>

          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <span className="font-semibold text-gray-600">
              {t('quoteSummary.subtotalCombined')}
            </span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">{t('quoteSummary.markup')}</span>
              <NumberInput
                label={t('quoteSummary.markupInputLabel')}
                value={markupPercentage ?? 0}
                min={0}
                max={100}
                step={1}
                formatOptions={{ style: 'decimal' }}
                endContent="%"
                isDisabled={readOnly}
                isReadOnly={readOnly}
                className="w-full"
                classNames={{ inputWrapper: 'bg-default-100' }}
              />
            </div>
            <span className="font-medium">{formatCurrency(markupCharge)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">{t('quoteSummary.tax')}</span>
            <span className="font-medium">{formatCurrency(tax)}</span>
          </div>

          <div className="my-2 h-px bg-gray-200"></div>

          <div className="flex items-center justify-between text-lg font-bold">
            <span>{t('quoteSummary.grandTotal')}</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
