'use client';

import React from 'react';
import { type InferSelectModel } from 'drizzle-orm';
import { customers } from '~/server/db/schema';
import { DeleteEntityDialog } from '~/components/shared/EntityDialog';

type Customer = InferSelectModel<typeof customers>;

export interface DeleteCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customer: Customer;
  isDeleting: boolean;
}

export function DeleteCustomerDialog({
  isOpen,
  onClose,
  onConfirm,
  customer,
  isDeleting,
}: DeleteCustomerDialogProps) {
  return (
    <DeleteEntityDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
      title="Delete Customer"
      entityName={customer.name}
      entityType="customer"
      cancelText="Cancel"
      confirmText="Delete"
      deletingText="Deleting..."
    />
  );
} 