import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';

interface EntityFormReadOnlyProps {
  title: string;
  data: Record<string, any>;
  fields: {
    key: string;
    label: string;
    formatter?: (value: any) => React.ReactNode;
  }[];
  actions?: React.ReactNode;
  footerContent?: React.ReactNode;
}

/**
 * A reusable component for displaying entity data in read-only mode
 */
export const EntityFormReadOnly: React.FC<EntityFormReadOnlyProps> = ({
  title,
  data,
  fields,
  actions,
  footerContent
}) => {
  return (
    <Card className="w-full mb-6">
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        {actions && (
          <div className="flex space-x-2">
            {actions}
          </div>
        )}
      </CardHeader>
      
      <CardBody>
        <div className="space-y-4">
          {fields.map((field) => {
            const value = data[field.key];
            const displayValue = field.formatter ? field.formatter(value) : value;
            
            return (
              <div key={field.key} className="grid grid-cols-3 gap-2">
                <div className="text-gray-600 font-medium">{field.label}:</div>
                <div className="col-span-2">{displayValue || '-'}</div>
              </div>
            );
          })}
          
          {footerContent && (
            <div className="mt-4 pt-4 border-t">
              {footerContent}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}; 