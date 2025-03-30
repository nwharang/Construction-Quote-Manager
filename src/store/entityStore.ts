import { create } from 'zustand';

/**
 * Entity settings to control routing and CRUD operations
 */
export interface EntitySettings {
  entityName: string;
  entityType: string;
  baseUrl: string;
  displayNameField: string;
  listPath: string;
  createPath: string;
  editPath: string;
  viewPath: string;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

/**
 * State for the entity store
 */
export interface EntityState {
  settings: EntitySettings | null;
  setEntitySettings: (settings: EntitySettings) => void;
  resetEntitySettings: () => void;
  showSuccessToast: (message: string) => void;
}

/**
 * Default entity settings
 */
export const defaultSettings: EntitySettings = {
  entityName: '',
  entityType: '',
  baseUrl: '',
  displayNameField: 'name',
  listPath: '',
  createPath: '',
  editPath: '',
  viewPath: '',
  canView: true,
  canEdit: true,
  canDelete: true,
};

/**
 * Store for managing entity settings
 */
export const useEntityStore = create<EntityState>((set) => ({
  settings: null,

  setEntitySettings: (settings: EntitySettings) => {
    set({ settings });
  },

  resetEntitySettings: () => {
    set({ settings: null });
  },
  
  showSuccessToast: (message: string) => {
    // This would normally use toast service, but since we're just fixing type errors
    // Implementation will be handled elsewhere
    console.log('Success:', message);
  }
})); 