'use client';

import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';

/**
 * Props for the DeleteEntityDialog component
 */
export interface DeleteEntityDialogProps {
  /**
   * Is the dialog open
   */
  isOpen: boolean;
  
  /**
   * Function to close the dialog
   */
  onClose: () => void;
  
  /**
   * Function to confirm deletion
   */
  onConfirm: () => void;
  
  /**
   * Is the deletion in progress
   */
  isDeleting?: boolean;
  
  /**
   * Title of the dialog
   */
  title?: string;
  
  /**
   * Message to display in the dialog body
   */
  message?: string;
  
  /**
   * The entity name to display in the default message
   */
  entityName?: string;
  
  /**
   * The entity type (e.g., 'customer', 'invoice')
   */
  entityType?: string;
  
  /**
   * Custom cancel button text
   */
  cancelText?: string;
  
  /**
   * Custom confirm button text
   */
  confirmText?: string;
  
  /**
   * Custom deleting button text
   */
  deletingText?: string;
}

/**
 * A reusable dialog component for entity deletion confirmation
 */
export function DeleteEntityDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  title = 'Confirm Deletion',
  message,
  entityName,
  entityType = 'item',
  cancelText = 'Cancel',
  confirmText = 'Delete',
  deletingText = 'Deleting...',
}: DeleteEntityDialogProps) {
  const defaultMessage = entityName 
    ? `Are you sure you want to delete ${entityName}? This action cannot be undone.`
    : `Are you sure you want to delete this ${entityType}? This action cannot be undone.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <p>{message || defaultMessage}</p>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="flat" 
            color="default" 
            onPress={onClose}
            isDisabled={isDeleting}
          >
            {cancelText}
          </Button>
          <Button 
            color="danger" 
            onPress={onConfirm}
            isLoading={isDeleting}
            isDisabled={isDeleting}
          >
            {isDeleting ? deletingText : confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 