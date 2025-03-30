import { useState, useCallback } from 'react';
import { useAppToast } from '@/components/providers/ToastProvider';

interface UseEntityCrudOptions<T> {
  entityName: string;
  fetchEntities: () => Promise<T[]>;
  fetchEntity?: (id: string) => Promise<T>;
  createEntity: (data: Partial<T>) => Promise<T>;
  updateEntity: (id: string, data: Partial<T>) => Promise<T>;
  deleteEntity: (id: string) => Promise<void>;
  onSuccess?: (action: 'fetch' | 'create' | 'update' | 'delete', entity?: T) => void;
  idField?: keyof T;
}

interface UseEntityCrudResult<T> {
  entities: T[];
  entity: T | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: Error | null;
  fetchAll: () => Promise<T[]>;
  fetchOne: (id: string) => Promise<T | undefined>;
  create: (data: Partial<T>) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  setEntities: (entities: T[]) => void;
}

/**
 * A reusable hook for handling CRUD operations
 * Can be used across quotes, customers, products, etc. to ensure consistent behavior
 */
export function useEntityCrud<T>({
  entityName,
  fetchEntities,
  fetchEntity,
  createEntity,
  updateEntity,
  deleteEntity,
  onSuccess,
  idField = 'id' as keyof T,
}: UseEntityCrudOptions<T>): UseEntityCrudResult<T> {
  const toast = useAppToast();
  const [entities, setEntities] = useState<T[]>([]);
  const [entity, setEntity] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all entities
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchEntities();
      setEntities(data);
      if (onSuccess) onSuccess('fetch');
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message || `Failed to fetch ${entityName}s`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [entityName, fetchEntities, onSuccess, toast]);

  // Fetch a single entity by ID
  const fetchOne = useCallback(async (id: string) => {
    if (!fetchEntity) {
      // If fetchEntity is not provided, try to find the entity in the existing list
      const foundEntity = entities.find(e => String(e[idField]) === id);
      if (foundEntity) {
        setEntity(foundEntity);
        return foundEntity;
      } else if (entities.length === 0) {
        // If the entities list is empty, fetch all first
        await fetchAll();
        const freshEntity = entities.find(e => String(e[idField]) === id);
        if (freshEntity) {
          setEntity(freshEntity);
          return freshEntity;
        }
      }
      
      setError(new Error(`${entityName} not found`));
      toast.error(`${entityName} not found`);
      return undefined;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchEntity(id);
      setEntity(data);
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message || `Failed to fetch ${entityName}`);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [entityName, fetchEntity, fetchAll, entities, idField, toast]);

  // Create a new entity
  const create = useCallback(async (data: Partial<T>) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const newEntity = await createEntity(data);
      
      // Update entities list with the new entity
      setEntities(prev => [...prev, newEntity]);
      
      toast.success(`${entityName} created successfully`);
      
      if (onSuccess) onSuccess('create', newEntity);
      
      return newEntity;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message || `Failed to create ${entityName}`);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [entityName, createEntity, onSuccess, toast]);

  // Update an existing entity
  const update = useCallback(async (id: string, data: Partial<T>) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const updatedEntity = await updateEntity(id, data);
      
      // Update entities list with the updated entity
      setEntities(prev => 
        prev.map(e => String(e[idField]) === id ? updatedEntity : e)
      );
      
      // Update current entity if it's the one being edited
      if (entity && String(entity[idField]) === id) {
        setEntity(updatedEntity);
      }
      
      toast.success(`${entityName} updated successfully`);
      
      if (onSuccess) onSuccess('update', updatedEntity);
      
      return updatedEntity;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message || `Failed to update ${entityName}`);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [entityName, updateEntity, onSuccess, entity, idField, toast]);

  // Delete an entity
  const remove = useCallback(async (id: string) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await deleteEntity(id);
      
      // Remove the entity from the list
      setEntities(prev => 
        prev.filter(e => String(e[idField]) !== id)
      );
      
      // Clear current entity if it's the one being deleted
      if (entity && String(entity[idField]) === id) {
        setEntity(null);
      }
      
      toast.success(`${entityName} deleted successfully`);
      
      if (onSuccess) onSuccess('delete');
      
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message || `Failed to delete ${entityName}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [entityName, deleteEntity, onSuccess, entity, idField, toast]);

  return {
    entities,
    entity,
    isLoading,
    isSubmitting,
    error,
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    setEntities,
  };
} 