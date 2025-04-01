'use client';

import React from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button 
} from '@heroui/react';

interface DeleteEntityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  entityName: string;
  entityLabel: string;
}

export function DeleteEntityDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  entityName,
  entityLabel
}: DeleteEntityDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
      <ModalContent>
        <ModalHeader>Delete {entityName}</ModalHeader>
        <ModalBody>
          <p>
            Are you sure you want to delete {entityName.toLowerCase()}{' '}
            <span className="font-medium">&quot;{entityLabel}&quot;</span>?
          </p>
          <p className="text-danger mt-2">This action cannot be undone.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button color="danger" onPress={handleConfirm} isLoading={isLoading}>
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 