"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';
import type { RouterOutputs } from '~/utils/api';
import { useAppToast } from '~/components/providers/ToastProvider';
import { ProductCategory } from '~/server/db/schema';

// Define types based on the database schema
type Product = RouterOutputs['product']['getById'];
type ProductList = RouterOutputs['product']['getAll']['items'];

// Types for form data
interface ProductFormData {
  name: string;
  description: string;
  category: keyof typeof ProductCategory;
  unitPrice: number;
  unit: string;
  sku?: string;
  manufacturer?: string;
  supplier?: string;
  location?: string;
  notes?: string;
}

// Define the context type
interface ProductsContextType {
  // Form state
  productFormData: ProductFormData;
  products: ProductList;
  
  // Product data for details view
  currentProduct: Product | null;
  loading: boolean;
  
  // Form handlers
  setProductFormData: (data: Partial<ProductFormData>) => void;
  
  // API actions
  createProduct: () => Promise<string | undefined>;
  updateProduct: (productId: string) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  fetchProductById: (productId: string) => Promise<void>;
  
  // UI state
  isLoading: boolean;
  isSubmitting: boolean;
  resetForm: () => void;
}

// Create the context with a default value
const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

// Default values for the form
const defaultProductFormData: ProductFormData = {
  name: '',
  description: '',
  category: 'LUMBER',
  unitPrice: 0,
  unit: 'each',
  sku: '',
  manufacturer: '',
  supplier: '',
  location: '',
  notes: '',
};

// Provider component
export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const toast = useAppToast();
  
  // State for form data
  const [productFormData, setProductFormDataState] = useState<ProductFormData>(defaultProductFormData);
  const [products, setProducts] = useState<ProductList>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  
  // API mutations
  const createProductMutation = api.product.create.useMutation();
  const updateProductMutation = api.product.update.useMutation();
  const deleteProductMutation = api.product.delete.useMutation();
  
  // Get the API context for cache invalidation
  const utils = api.useContext();
  
  // Fetch all products
  const { data: productsData } = api.product.getAll.useQuery(
    {
      page: 1,
      limit: 100,
    },
    { 
      enabled: status === 'authenticated',
      refetchOnWindowFocus: true
    }
  );
  
  // Update products state when data changes
  useEffect(() => {
    if (productsData) {
      setProducts(productsData.items);
    }
  }, [productsData]);
  
  // Form handlers
  const setProductFormData = useCallback((data: Partial<ProductFormData>) => {
    setProductFormDataState(prev => ({ ...prev, ...data }));
  }, []);
  
  // Reset form
  const resetForm = useCallback(() => {
    setProductFormDataState(defaultProductFormData);
  }, []);
  
  // Create product
  const createProduct = useCallback(async (): Promise<string | undefined> => {
    if (!session?.user) {
      toast.error('You must be logged in to create a product');
      return undefined;
    }
    
    if (!productFormData.name) {
      toast.error('Please provide a product name');
      return undefined;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the product
      const result = await createProductMutation.mutateAsync({
        name: productFormData.name,
        description: productFormData.description || undefined,
        category: productFormData.category,
        unitPrice: productFormData.unitPrice,
        unit: productFormData.unit,
        sku: productFormData.sku,
        manufacturer: productFormData.manufacturer,
        supplier: productFormData.supplier,
        location: productFormData.location,
        notes: productFormData.notes,
      });
      
      // Invalidate queries to refresh UI
      utils.product.getAll.invalidate();
      
      toast.success('Product created successfully');
      return result?.id;
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(`Failed to create product: ${error.message || ''}`);
      return undefined;
    } finally {
      setIsSubmitting(false);
    }
  }, [productFormData, session, createProductMutation, utils, toast]);
  
  // Update product
  const updateProduct = useCallback(async (productId: string): Promise<boolean> => {
    if (!session?.user) {
      toast.error('You must be logged in to update a product');
      return false;
    }
    
    if (!productFormData.name) {
      toast.error('Please provide a product name');
      return false;
    }
    
    try {
      setIsSubmitting(true);
      
      // Update the product
      await updateProductMutation.mutateAsync({
        id: productId,
        data: {
          name: productFormData.name,
          description: productFormData.description || undefined,
          category: productFormData.category,
          unitPrice: productFormData.unitPrice,
          unit: productFormData.unit,
          sku: productFormData.sku,
          manufacturer: productFormData.manufacturer,
          supplier: productFormData.supplier,
          location: productFormData.location,
          notes: productFormData.notes,
        }
      });
      
      // Invalidate queries to refresh UI
      utils.product.getAll.invalidate();
      utils.product.getById.invalidate({ id: productId });
      
      toast.success('Product updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(`Failed to update product: ${error.message || ''}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [productFormData, session, updateProductMutation, utils, toast]);
  
  // Delete product
  const deleteProduct = useCallback(async (productId: string): Promise<boolean> => {
    if (!session?.user) {
      toast.error('You must be logged in to delete a product');
      return false;
    }
    
    try {
      await deleteProductMutation.mutateAsync({ id: productId });
      
      // Invalidate the getAll query to refresh the UI
      utils.product.getAll.invalidate();
      
      toast.success('Product deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(`Failed to delete product: ${error.message || ''}`);
      return false;
    }
  }, [session, deleteProductMutation, utils, toast]);
  
  // Fetch product by ID
  const fetchProductById = useCallback(async (productId: string) => {
    try {
      setLoading(true);
      resetForm();
      
      const productData = await utils.product.getById.fetch({ id: productId });
      setCurrentProduct(productData);
      
      // Also update form data for potential editing
      if (productData) {
        setProductFormDataState({
          name: productData.name,
          description: productData.description || '',
          category: productData.category,
          unitPrice: parseFloat(productData.unitPrice),
          unit: productData.unit,
          sku: productData.sku || '',
          manufacturer: productData.manufacturer || '',
          supplier: productData.supplier || '',
          location: productData.location || '',
          notes: productData.notes || '',
        });
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product details");
    } finally {
      setLoading(false);
    }
  }, [utils.product.getById, resetForm, toast]);
  
  // Context value
  const value: ProductsContextType = {
    productFormData,
    products,
    currentProduct,
    loading,
    setProductFormData,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchProductById,
    isLoading,
    isSubmitting,
    resetForm,
  };
  
  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

// Custom hook to use the products context
export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
} 