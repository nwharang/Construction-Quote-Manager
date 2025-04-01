'use client';

import React, { useEffect, useState } from 'react';
import { EntityModal } from '~/components/shared/EntityModal';
import { FormField } from '~/components/ui/FormField';

interface Product {
  id?: string;
  name: string;
  description?: string;
  unitPrice: number;
  category?: string;
}

interface ProductFormModalProps {
  product?: Product;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Product) => Promise<void>;
  isLoading?: boolean;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Product>({
    name: '',
    description: '',
    unitPrice: 0,
    category: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          id: product.id,
          name: product.name,
          description: product.description,
          unitPrice: product.unitPrice,
          category: product.category
        });
      } else {
        setFormData({
          name: '',
          description: '',
          unitPrice: 0,
          category: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) : value;
    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.unitPrice < 0) {
      newErrors.unitPrice = 'Price must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleModalSubmit = async () => {
    if (validateForm()) {
      try {
        await onSubmit(formData);
        onClose();
      } catch (error) {
        console.error('Error submitting product:', error);
      }
    }
  };

  const isEditMode = !!product?.id;

  return (
    <EntityModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Product' : 'Create Product'}
      isSubmitting={isLoading}
      onSubmit={handleModalSubmit}
      submitText={isEditMode ? 'Update Product' : 'Create Product'}
    >
      <div className="space-y-6">
        <FormField
          id="name"
          name="name"
          label="Name"
          value={formData.name || ''}
          onChange={handleInputChange}
          placeholder="Product Name"
          error={errors.name}
          isRequired
        />

        <FormField
          id="description"
          name="description"
          label="Description"
          type="textarea"
          value={formData.description || ''}
          onChange={handleInputChange}
          placeholder="Product description"
        />

        <FormField
          id="unitPrice"
          name="unitPrice"
          label="Unit Price"
          type="number"
          value={formData.unitPrice}
          onChange={handleInputChange}
          error={errors.unitPrice}
          min={0}
        />

        <FormField
          id="category"
          name="category"
          label="Category"
          value={formData.category || ''}
          onChange={handleInputChange}
          placeholder="Product Category"
        />
      </div>
    </EntityModal>
  );
}; 