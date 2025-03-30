import React from 'react';
import { Card, CardHeader, CardBody, Divider, NumberInput } from '@heroui/react';
import { formatCurrency } from '~/utils/currency';
import { formatPercentage } from '~/utils/formatters';

interface QuoteAdjustmentsProps {
  subtotal: number;
  complexityPercentage: number;
  complexityCharge: number;
  markupPercentage: number;
  markupCharge: number;
  onComplexityChange: (value: number) => void;
  onMarkupChange: (value: number) => void;
}

/**
 * Component for handling quote adjustments (complexity & markup)
 * Follows the UI consistency rules from Context.md
 */
export const QuoteAdjustments: React.FC<QuoteAdjustmentsProps> = ({
  subtotal,
  complexityPercentage,
  complexityCharge,
  markupPercentage,
  markupCharge,
  onComplexityChange,
  onMarkupChange,
}) => {
  // Format currency values
  const formattedSubtotal = formatCurrency(subtotal);
  const formattedComplexityCharge = formatCurrency(complexityCharge);
  const formattedMarkupCharge = formatCurrency(markupCharge);
  
  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center px-6 py-4">
        <h3 className="text-xl font-semibold">Quote Adjustments</h3>
      </CardHeader>
      <Divider />
      <CardBody className="px-6 py-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formattedSubtotal}</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Complexity Charge</span>
              <span className="text-sm text-muted-foreground">
                ({formatPercentage(complexityPercentage)})
              </span>
            </div>
            <NumberInput
              label="Complexity Percentage"
              value={complexityPercentage}
              onValueChange={(value) => onComplexityChange(value as number)}
              endContent="%"
              min={0}
              step={0.1}
              formatOptions={{ 
                style: 'decimal', 
                minimumFractionDigits: 1, 
                maximumFractionDigits: 1 
              }}
              size="sm"
              className="w-full"
            />
            <div className="flex justify-between items-center text-sm">
              <span>Amount</span>
              <span className="font-medium">{formattedComplexityCharge}</span>
            </div>
          </div>
          
          <Divider />
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Markup</span>
              <span className="text-sm text-muted-foreground">
                ({formatPercentage(markupPercentage)})
              </span>
            </div>
            <NumberInput
              label="Markup Percentage"
              value={markupPercentage}
              onValueChange={(value) => onMarkupChange(value as number)}
              endContent="%"
              min={0}
              step={0.1}
              formatOptions={{ 
                style: 'decimal', 
                minimumFractionDigits: 1, 
                maximumFractionDigits: 1 
              }}
              size="sm"
              className="w-full"
            />
            <div className="flex justify-between items-center text-sm">
              <span>Amount</span>
              <span className="font-medium">{formattedMarkupCharge}</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}; 