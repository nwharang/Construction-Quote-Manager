import { useState } from 'react';

type ModalMode = 'create' | 'edit' | 'delete' | 'view';

export interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  entityId?: string;
  isLoading: boolean;
}

const initialModalState: ModalState = {
  isOpen: false,
  mode: 'create',
  entityId: undefined,
  isLoading: false
};

export interface UseModalCRUDProps {
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

export const useModalCRUD = (props?: UseModalCRUDProps) => {
  const [modalState, setModalState] = useState<ModalState>(initialModalState);

  // Open modal for creating a new entity
  const openCreateModal = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      entityId: undefined,
      isLoading: false
    });
  };

  // Open modal for editing an existing entity
  const openEditModal = (entityId: string) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      entityId,
      isLoading: false
    });
  };

  // Open modal for viewing an entity (read-only)
  const openViewModal = (entityId: string) => {
    setModalState({
      isOpen: true,
      mode: 'view',
      entityId,
      isLoading: false
    });
  };

  // Open modal for deleting an entity
  const openDeleteModal = (entityId: string) => {
    setModalState({
      isOpen: true,
      mode: 'delete',
      entityId,
      isLoading: false
    });
  };

  // Close the modal
  const closeModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  // Set loading state
  const setLoading = (isLoading: boolean) => {
    setModalState(prev => ({
      ...prev,
      isLoading
    }));
  };

  // Handle successful create operation
  const handleCreateSuccess = () => {
    closeModal();
    props?.onCreateSuccess?.();
  };

  // Handle successful update operation
  const handleUpdateSuccess = () => {
    closeModal();
    props?.onUpdateSuccess?.();
  };

  // Handle successful delete operation
  const handleDeleteSuccess = () => {
    closeModal();
    props?.onDeleteSuccess?.();
  };

  return {
    modalState,
    openCreateModal,
    openEditModal,
    openViewModal,
    openDeleteModal,
    closeModal,
    setLoading,
    handleCreateSuccess,
    handleUpdateSuccess,
    handleDeleteSuccess,
    isCreate: modalState.mode === 'create',
    isEdit: modalState.mode === 'edit',
    isView: modalState.mode === 'view',
    isDelete: modalState.mode === 'delete'
  };
}; 