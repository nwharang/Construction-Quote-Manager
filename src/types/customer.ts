/**
 * Customer type definition for use in components
 */
export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string | null;
  creatorName: string | null;
}

/**
 * Customer form data type for creating and updating customers
 */
export interface CustomerFormData {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
} 