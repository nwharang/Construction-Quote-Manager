"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';
import type { RouterOutputs } from '~/utils/api';
import { useAppToast } from '~/components/providers/ToastProvider';

// Define types based on the database schema
type Customer = RouterOutputs['customer']['getById'];
type CustomersList = RouterOutputs['customer']['getAll']['customers'];

// Types for form data
interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

// Define the context type
interface CustomersContextType {
  // Form state
  customerFormData: CustomerFormData;
  customers: CustomersList;
  
  // Customer data for details view
  currentCustomer: Customer | null;
  customerQuotes: RouterOutputs['quote']['getAll']['quotes'];
  loading: boolean;
  
  // Form handlers
  setCustomerFormData: (data: Partial<CustomerFormData>) => void;
  
  // API actions
  createCustomer: () => Promise<string | undefined>;
  updateCustomer: (customerId: string) => Promise<boolean>;
  deleteCustomer: (customerId: string) => Promise<boolean>;
  fetchCustomerById: (customerId: string) => Promise<void>;
  
  // UI state
  isLoading: boolean;
  isSubmitting: boolean;
  resetForm: () => void;
}

// Create the context with a default value
const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

// Default values for the form
const defaultCustomerFormData: CustomerFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

// Provider component
export function CustomersProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const toast = useAppToast();
  
  // State for form data
  const [customerFormData, setCustomerFormDataState] = useState<CustomerFormData>(defaultCustomerFormData);
  const [customers, setCustomers] = useState<CustomersList>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [customerQuotes, setCustomerQuotes] = useState<RouterOutputs['quote']['getAll']['quotes']>([]);
  const [loading, setLoading] = useState(false);
  
  // API mutations
  const createCustomerMutation = api.customer.create.useMutation();
  const updateCustomerMutation = api.customer.update.useMutation();
  const deleteCustomerMutation = api.customer.delete.useMutation();
  
  // Get the API context for cache invalidation
  const utils = api.useContext();
  
  // Fetch all customers
  const { data: customersData } = api.customer.getAll.useQuery(
    {
      page: 1,
      limit: 100,
    },
    { 
      enabled: status === 'authenticated',
      refetchOnWindowFocus: true
    }
  );
  
  // Update customers state when data changes
  useEffect(() => {
    if (customersData) {
      setCustomers(customersData.customers);
    }
  }, [customersData]);
  
  // Form handlers
  const setCustomerFormData = useCallback((data: Partial<CustomerFormData>) => {
    setCustomerFormDataState(prev => ({ ...prev, ...data }));
  }, []);
  
  // Reset form
  const resetForm = useCallback(() => {
    setCustomerFormDataState(defaultCustomerFormData);
  }, []);
  
  // Create customer
  const createCustomer = useCallback(async (): Promise<string | undefined> => {
    if (!session?.user) {
      toast.error('You must be logged in to create a customer');
      return undefined;
    }
    
    if (!customerFormData.name) {
      toast.error('Please provide a customer name');
      return undefined;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the customer
      const result = await createCustomerMutation.mutateAsync({
        name: customerFormData.name,
        email: customerFormData.email || undefined,
        phone: customerFormData.phone || undefined,
        address: customerFormData.address || undefined,
        notes: customerFormData.notes || undefined,
      });
      
      // Invalidate queries to refresh UI
      utils.customer.getAll.invalidate();
      
      toast.success('Customer created successfully');
      return result?.id;
    } catch (error: any) {
      console.error('Error creating customer:', error);
      toast.error(`Failed to create customer: ${error.message || ''}`);
      return undefined;
    } finally {
      setIsSubmitting(false);
    }
  }, [customerFormData, session, createCustomerMutation, utils, toast]);
  
  // Update customer
  const updateCustomer = useCallback(async (customerId: string): Promise<boolean> => {
    if (!session?.user) {
      toast.error('You must be logged in to update a customer');
      return false;
    }
    
    if (!customerFormData.name) {
      toast.error('Please provide a customer name');
      return false;
    }
    
    try {
      setIsSubmitting(true);
      
      // Update the customer
      await updateCustomerMutation.mutateAsync({
        id: customerId,
        name: customerFormData.name,
        email: customerFormData.email || undefined,
        phone: customerFormData.phone || undefined,
        address: customerFormData.address || undefined,
        notes: customerFormData.notes || undefined,
      });
      
      // Invalidate queries to refresh UI
      utils.customer.getAll.invalidate();
      utils.customer.getById.invalidate({ id: customerId });
      
      toast.success('Customer updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast.error(`Failed to update customer: ${error.message || ''}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [customerFormData, session, updateCustomerMutation, utils, toast]);
  
  // Delete customer
  const deleteCustomer = useCallback(async (customerId: string): Promise<boolean> => {
    if (!session?.user) {
      toast.error('You must be logged in to delete a customer');
      return false;
    }
    
    try {
      await deleteCustomerMutation.mutateAsync({ id: customerId });
      
      // Invalidate the getAll query to refresh the UI
      utils.customer.getAll.invalidate();
      
      toast.success('Customer deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast.error(`Failed to delete customer: ${error.message || ''}`);
      return false;
    }
  }, [session, deleteCustomerMutation, utils, toast]);
  
  // Fetch customer by ID
  const fetchCustomerById = useCallback(async (customerId: string) => {
    try {
      setLoading(true);
      resetForm();
      
      const customerData = await utils.customer.getById.fetch({ id: customerId });
      setCurrentCustomer(customerData);
      
      // Also update form data for potential editing
      if (customerData) {
        setCustomerFormDataState({
          name: customerData.name,
          email: customerData.email || '',
          phone: customerData.phone || '',
          address: customerData.address || '',
          notes: customerData.notes || '',
        });
        
        // Fetch quotes for this customer
        const quotesData = await utils.quote.getAll.fetch({ 
          search: customerId 
        });
        
        if (quotesData) {
          setCustomerQuotes(quotesData.quotes);
        }
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      toast.error("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  }, [utils.customer.getById, utils.quote.getAll, resetForm, toast]);
  
  // Context value
  const value: CustomersContextType = {
    customerFormData,
    customers,
    currentCustomer,
    customerQuotes,
    loading,
    setCustomerFormData,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    fetchCustomerById,
    isLoading,
    isSubmitting,
    resetForm,
  };
  
  return (
    <CustomersContext.Provider value={value}>
      {children}
    </CustomersContext.Provider>
  );
}

// Custom hook to use the customers context
export function useCustomers() {
  const context = useContext(CustomersContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomersProvider');
  }
  return context;
} 