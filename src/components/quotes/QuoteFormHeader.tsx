import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, Breadcrumbs, BreadcrumbItem } from '@heroui/react';
import Link from 'next/link';
import { useTranslation } from '~/hooks/useTranslation';

export const QuoteFormHeader: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <Button
          as={Link}
          href="/admin/quotes"
          variant="light"
          startContent={<ArrowLeft size={18} />}
        >
          Back to Quotes
        </Button>
      </div>
      
      <Breadcrumbs className="mb-4">
        <BreadcrumbItem href="/admin">Dashboard</BreadcrumbItem>
        <BreadcrumbItem href="/admin/quotes">Quotes</BreadcrumbItem>
        <BreadcrumbItem>New Quote</BreadcrumbItem>
      </Breadcrumbs>
      
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create New Quote</h1>
        <p className="text-muted-foreground">Fill out the form below to create a new quote</p>
      </div>
    </div>
  );
}; 