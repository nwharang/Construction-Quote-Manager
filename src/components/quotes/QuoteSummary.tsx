import React from 'react';
import { Card, CardHeader, CardBody, Divider } from '@heroui/react';
import { formatCurrency } from '~/utils/currency';

interface QuoteSummaryData {
  subtotal: number;
  complexityCharge: number;
  markupCharge: number;
  total: number;
  taxRate?: number;
  taxAmount?: number;
}

interface QuoteSummaryProps {
  summary: QuoteSummaryData;
  showTax?: boolean;
  className?: string;
}

/**
 * Component for displaying the quote summary with detailed breakdown
 */
export const QuoteSummary: React.FC<QuoteSummaryProps> = ({
  summary,
  showTax = false,
  className = "",
}) => {
  const {
    subtotal,
    complexityCharge,
    markupCharge,
    total,
    taxRate,
    taxAmount,
  } = summary;

  const hasAdjustments = complexityCharge > 0 || markupCharge > 0;
  const hasTax = showTax && taxRate && taxRate > 0 && taxAmount && taxAmount > 0;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="flex justify-between items-center px-6 py-4">
        <h3 className="text-xl font-semibold">Quote Summary</h3>
      </CardHeader>
      <Divider />
      <CardBody className="px-6 py-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {hasAdjustments && (
          <>
            {complexityCharge > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Complexity Charge</span>
                <span>{formatCurrency(complexityCharge)}</span>
              </div>
            )}

            {markupCharge > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Markup</span>
                <span>{formatCurrency(markupCharge)}</span>
              </div>
            )}
          </>
        )}

        {hasTax && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Tax ({taxRate}%)</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
        )}

        <Divider />
        
        <div className="flex justify-between items-center font-semibold">
          <span>Total</span>
          <span className="text-lg">{formatCurrency(total)}</span>
        </div>
      </CardBody>
    </Card>
  );
};

export type { QuoteSummaryData }; 