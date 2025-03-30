import { useState, useCallback } from 'react';
import type { Material } from '~/types/quote';

interface UseMaterialModalProps {
  onSaveMaterial: (material: Omit<Material, 'id' | 'taskId'>, taskIndex: number, materialIndex?: number) => void;
}

/**
 * Custom hook for managing the material modal
 * Provides state and functions for opening/closing the modal and saving materials
 */
export function useMaterialModal({ onSaveMaterial }: UseMaterialModalProps) {
  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number | null>(null);
  const [currentMaterialIndex, setCurrentMaterialIndex] = useState<number | null>(null);
  const [initialMaterial, setInitialMaterial] = useState<Partial<Material>>({});

  /**
   * Open the material modal for adding/editing a material
   * @param taskIndex Index of the task
   * @param materialIndex Optional index of the material to edit
   * @param material Optional initial material data
   */
  const openMaterialModal = useCallback(
    (taskIndex: number, materialIndex?: number, material?: Partial<Material>) => {
      setCurrentTaskIndex(taskIndex);
      setCurrentMaterialIndex(materialIndex !== undefined ? materialIndex : null);
      setInitialMaterial(material || {});
      setIsOpen(true);
    },
    []
  );

  /**
   * Close the material modal
   */
  const closeMaterialModal = useCallback(() => {
    setIsOpen(false);
    setCurrentTaskIndex(null);
    setCurrentMaterialIndex(null);
    setInitialMaterial({});
  }, []);

  /**
   * Save a material
   * @param material Material data to save
   */
  const saveMaterial = useCallback(
    (material: Omit<Material, 'id' | 'taskId'>) => {
      if (currentTaskIndex !== null) {
        onSaveMaterial(material, currentTaskIndex, currentMaterialIndex ?? undefined);
        closeMaterialModal();
      }
    },
    [currentTaskIndex, currentMaterialIndex, onSaveMaterial, closeMaterialModal]
  );

  return {
    isOpen,
    initialMaterial,
    isEditing: currentMaterialIndex !== null,
    openMaterialModal,
    closeMaterialModal,
    saveMaterial,
  };
} 