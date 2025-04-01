import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { formatCurrency, formatPercentage } from '~/utils/formatters';

export interface QuoteSummaryData {
  subtotal: number;
  complexityPercentage: number;
  markupPercentage: number;
  taxPercentage: number;
  complexity: number;
  markup: number;
  tax: number;
  grandTotal: number;
}

interface QuoteSummaryReadOnlyProps {
  data: QuoteSummaryData;
}

/**
 * A read-only display of quote financial summary
 */
export const QuoteSummaryReadOnly: React.FC<QuoteSummaryReadOnlyProps> = ({ data }) => {
  const {
    subtotal,
    complexityPercentage,
    markupPercentage,
    taxPercentage,
    complexity,
    markup,
    tax,
    grandTotal
  } = data;

  return (
    <Card className="mb-6">
      <CardHeader>
        <h2 className="text-xl font-semibold">Quote Summary</h2>
      </CardHeader>
      
      <CardBody>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Subtotal</h3>
              <p className="text-gray-700">{formatCurrency(subtotal)}</p>
            </div>
            
            <div>
              <h3 className="font-medium">Complexity</h3>
              <p className="text-gray-700">
                {formatPercentage(complexityPercentage)} ({formatCurrency(complexity)})
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Markup</h3>
              <p className="text-gray-700">
                {formatPercentage(markupPercentage)} ({formatCurrency(markup)})
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Tax</h3>
              <p className="text-gray-700">
                {formatPercentage(taxPercentage)} ({formatCurrency(tax)})
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Grand Total</h3>
              <p className="text-xl font-bold">{formatCurrency(grandTotal)}</p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}; 