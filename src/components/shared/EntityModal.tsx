'use client';

import React from 'react';
import type { ReactNode } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Spinner
} from '@heroui/react';

export interface EntityModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  
  /**
   * Function to close the modal
   */
  onClose: () => void;
  
  /**
   * Modal title
   */
  title: string;
  
  /**
   * Modal content
   */
  children: ReactNode;
  
  /**
   * Optional custom footer
   */
  footer?: ReactNode;
  
  /**
   * Optional size of the modal
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  
  /**
   * Whether the modal is in a loading state
   */
  isLoading?: boolean;
  
  /**
   * Whether the modal is in a submitting state
   */
  isSubmitting?: boolean;
  
  /**
   * Function to handle submission
   */
  onSubmit?: () => void | Promise<void>;
  
  /**
   * Custom submit button text
   */
  submitText?: string;
  
  /**
   * Custom cancel button text
   */
  cancelText?: string;
  
  /**
   * Whether to hide the footer
   */
  hideFooter?: boolean;
  
  /**
   * Whether to hide the submit button
   */
  hideSubmitButton?: boolean;
}

/**
 * A reusable modal component for entity operations
 */
export function EntityModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'xl',
  isLoading = false,
  isSubmitting = false,
  onSubmit,
  submitText = 'Save',
  cancelText = 'Cancel',
  hideFooter = false,
  hideSubmitButton = false,
}: EntityModalProps) {
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    }
  };

  // If custom footer is provided, use it
  const footerContent = footer ? (
    footer
  ) : !hideFooter ? (
    <div className="flex justify-end gap-2">
      <Button
        variant="flat"
        onPress={onClose}
        isDisabled={isSubmitting}
      >
        {cancelText}
      </Button>
      {onSubmit && !hideSubmitButton && (
        <Button
          color="primary"
          onPress={handleSubmit}
          isLoading={isSubmitting}
          isDisabled={isLoading || isSubmitting}
        >
          {submitText}
        </Button>
      )}
    </div>
  ) : null;
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size={size}
      scrollBehavior="inside"
      isDismissable={!isSubmitting}
      isKeyboardDismissDisabled={isSubmitting}
    >
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-semibold">{title}</h3>
        </ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" color="primary" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : (
            children
          )}
        </ModalBody>
        {!hideFooter && (
          <ModalFooter>
            {footerContent}
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}

/**
 * Hook to manage entity modal state and open/close functions
 * @returns Modal state and functions
 */
export function useEntityModal() {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  
  return {
    isOpen,
    onOpen,
    onClose,
    onOpenChange
  };
} 