/**
 * Central export point for all Zustand stores
 */

// Export all stores from this file
export * from './uiStore';
export * from './entityStore';
export * from './toastStore';
export * from './configStore';

// Import useEntityStore for the helper function
import { useEntityStore } from './entityStore';

/**
 * Creates an entity store with the specified settings
 * @param entityType The type of entity
 * @param baseUrl The base URL for entity operations
 * @param displayNameField The field to use for display names
 */
export function createEntityStore(entityType: string, baseUrl: string, displayNameField: string = 'name') {
  useEntityStore.getState().setEntitySettings({
    entityName: entityType,
    entityType,
    baseUrl,
    displayNameField,
    canView: true,
    canEdit: true,
    canDelete: true,
    listPath: baseUrl,
    createPath: `${baseUrl}/new`,
    editPath: `${baseUrl}/:id/edit`,
    viewPath: `${baseUrl}/:id`,
  });
} 