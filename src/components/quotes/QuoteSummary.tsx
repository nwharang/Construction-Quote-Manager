import React from 'react';
import { Card, CardBody, CardFooter, Divider, NumberInput } from '@heroui/react';
import { useTranslation } from '~/hooks/useTranslation';
import type { QuoteTotals } from '~/types/quote';

interface QuoteSummaryProps {
  totals: QuoteTotals;
  complexityCharge: number;
  markupCharge: number;
  handleNumberChange: (name: string, value: number) => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
}

export function QuoteSummary({
  totals,
  complexityCharge,
  markupCharge,
  handleNumberChange,
  handleSubmit,
  isSubmitting,
}: QuoteSummaryProps) {
  const { formatCurrency } = useTranslation();

  return (
    <Card className="mb-6">
      <CardBody>
        <h2 className="text-xl font-bold mb-4">Quote Summary</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal (Tasks):</span>
            <span data-testid="subtotal-tasks">{formatCurrency(totals.subtotalTasks)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Subtotal (Materials):</span>
            <span data-testid="subtotal-materials">{formatCurrency(totals.subtotalMaterials)}</span>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span>Complexity Charge:</span>
            <div className="w-32">
              <NumberInput
                value={complexityCharge}
                onValueChange={(value) => handleNumberChange('complexityCharge', value as number)}
                id="complexityCharge"
                name="complexityCharge"
                formatOptions={{ style: 'currency', currency: 'USD' }}
                min={0}
                step={1}
                data-testid="complexity-charge-input"
                aria-label="Complexity Charge"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span>Markup Charge:</span>
            <div className="w-32">
              <NumberInput
                value={markupCharge}
                onValueChange={(value) => handleNumberChange('markupCharge', value as number)}
                id="markupCharge"
                name="markupCharge"
                formatOptions={{ style: 'currency', currency: 'USD' }}
                min={0}
                step={1}
                data-testid="markup-charge-input"
                aria-label="Markup Charge"
              />
            </div>
          </div>
        </div>
      </CardBody>
      
      <Divider />
      
      <CardFooter className="flex flex-col">
        <div className="flex justify-between items-center w-full">
          <span className="text-lg font-bold">Grand Total:</span>
          <span className="text-lg font-bold" data-testid="grand-total">
            {formatCurrency(totals.grandTotal)}
          </span>
        </div>
        
        <div className="mt-4 flex justify-end w-full">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary text-white px-6 py-3 rounded-md font-medium flex items-center gap-2 disabled:opacity-70"
            data-testid="submit-quote-button"
          >
            {isSubmitting ? 'Creating Quote...' : 'Create Quote'}
          </button>
        </div>
      </CardFooter>
    </Card>
  );
} 