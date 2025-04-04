import React from 'react';
import { Chip } from '@heroui/react';
import { useTranslation } from '~/hooks/useTranslation';

// Map status to display settings
export const QuoteStatusSettings: Record<
  string,
  { color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'; label: string }
> = {
  DRAFT: { color: 'default', label: 'Draft' },
  SENT: { color: 'primary', label: 'Sent' },
  ACCEPTED: { color: 'success', label: 'Accepted' },
  REJECTED: { color: 'danger', label: 'Rejected' },
};

interface QuoteStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function QuoteStatusBadge({ status, size = 'sm', className = '' }: QuoteStatusBadgeProps) {
  const { t } = useTranslation();
  
  const statusInfo = QuoteStatusSettings[status] || { 
    color: 'default', 
    label: status 
  };
  
  // Get the correct translation key or fallback to label
  const statusLabel = (() => {
    try {
      switch (statusInfo.label.toLowerCase()) {
        case 'draft':
          return t('quotes.status.draft');
        case 'sent':
          return t('quotes.status.sent');
        case 'accepted':
          return t('quotes.status.accepted');
        case 'rejected':
          return t('quotes.status.rejected');
        default:
          return statusInfo.label;
      }
    } catch (error) {
      return statusInfo.label;
    }
  })();
  
  return (
    <Chip
      color={statusInfo.color}
      variant="flat"
      size={size}
      className={`capitalize ${className}`}
    >
      {statusLabel}
    </Chip>
  );
} 