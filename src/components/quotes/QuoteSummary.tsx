'use client';

import React, { useEffect, useMemo } from 'react';
import { Card, CardBody, Divider } from '@heroui/react';
import { useTranslation } from '~/hooks/useTranslation';
// Assuming formatCurrency is available via useTranslation or a separate util
import type { TaskFormValues } from './QuoteForm';

interface QuoteSummaryProps {
  tasks: TaskFormValues[];
  markupPercentage: number;
}

export const QuoteSummary: React.FC<QuoteSummaryProps> = ({ tasks, markupPercentage }) => {
  const { t, formatCurrency } = useTranslation(); // Assuming formatCurrency comes from here

  const calculateTotals = () => {
    let subtotalTasks = 0;
    let subtotalMaterials = 0;

    tasks.forEach((task) => {
      // Add labor costs (ensure price is treated as number)
      subtotalTasks += Number(task.price || 0);

      // Add material costs
      if (task.materialType === 'LUMPSUM') {
        subtotalMaterials += Number(task.estimatedMaterialsCostLumpSum || 0);
      } else if (task.materialType === 'ITEMIZED' && task.materials) {
        task.materials.forEach((material) => {
          subtotalMaterials += Number(material.quantity || 1) * Number(material.unitPrice || 0);
        });
      }
    });

    const subtotalCombined = subtotalTasks + subtotalMaterials;
    const markupAmount = subtotalCombined * Number(markupPercentage || 0);
    const grandTotal = subtotalCombined + markupAmount;

    return {
      subtotalTasks,
      subtotalMaterials,
      subtotalCombined,
      markupAmount,
      grandTotal,
    };
  };

  const totals = calculateTotals();

  return (
    <Card className="mt-6">
      <CardBody>
        <h3 className="mb-4 text-lg font-semibold">{t('quoteSummary.title')}</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('quoteSummary.subtotalTasks')}:
            </span>
            <span className="text-sm font-medium">{formatCurrency(totals.subtotalTasks)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('quoteSummary.subtotalMaterials')}:
            </span>
            <span className="text-sm font-medium">{formatCurrency(totals.subtotalMaterials)}</span>
          </div>
          <Divider className="my-2" />
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('quoteSummary.subtotalCombined')}:
            </span>
            <span className="text-sm font-medium">{formatCurrency(totals.subtotalCombined)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('quoteSummary.markupCalculated', { percentage: markupPercentage })}:
            </span>
            <span className="text-sm font-medium">{formatCurrency(totals.markupAmount)}</span>
          </div>
          <Divider className="my-2" />
          <div className="flex justify-between">
            <span className="text-lg font-semibold">{t('quoteSummary.grandTotal')}:</span>
            <span className="text-lg font-semibold">{formatCurrency(totals.grandTotal)}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
