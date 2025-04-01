import React from 'react';
import { Select } from '@heroui/react';

// Status types
const QUOTE_STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const;
type QuoteStatus = typeof QUOTE_STATUSES[number];

interface QuoteStatusSelectorProps {
  selectedStatus: QuoteStatus;
  onStatusSelect: (status: QuoteStatus) => void;
  error?: string;
  disabled?: boolean;
}

export const QuoteStatusSelector: React.FC<QuoteStatusSelectorProps> = ({
  selectedStatus,
  onStatusSelect,
  error,
  disabled = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusSelect(e.target.value as QuoteStatus);
  };

  // Define status display names and colors
  const statusConfig = {
    DRAFT: { label: 'Draft', color: 'bg-gray-200 text-gray-800' },
    SENT: { label: 'Sent', color: 'bg-blue-200 text-blue-800' },
    ACCEPTED: { label: 'Accepted', color: 'bg-green-200 text-green-800' },
    REJECTED: { label: 'Rejected', color: 'bg-red-200 text-red-800' }
  };

  return (
    <div>
      <Select
        id="status"
        value={selectedStatus}
        onChange={handleChange}
        disabled={disabled}
        className={error ? 'border-red-500' : ''}
      >
        {QUOTE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {statusConfig[status].label}
          </option>
        ))}
      </Select>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
}; 