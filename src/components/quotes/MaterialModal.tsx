import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  NumberInput,
  Textarea,
  Autocomplete,
  AutocompleteItem,
  Divider,
  Select,
  SelectItem,
  useDisclosure,
  Spinner
} from '@heroui/react';
import { formatCurrency } from '~/utils/currency';
import { type Material, type Product } from '~/types/quote';
import { CurrencyField, TextField, SelectField, QuantityField } from '~/components/shared/EntityFormFields';
import { api } from '~/utils/api';
import { useMaterialModal } from '~/hooks/useMaterialModal';

interface MaterialModalProps {
  onSaveMaterial: (material: Omit<Material, 'id' | 'taskId'>, taskIndex: number, materialIndex?: number) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  initialMaterial: Partial<Material>;
  isEditing: boolean;
  taskIndex: number | null;
  materialIndex?: number;
  products?: Product[];
}

/**
 * MaterialModal component for adding/editing materials in a task
 * Uses our reusable useMaterialModal hook for state management
 */
export function MaterialModal({
  onSaveMaterial,
  isOpen,
  onOpenChange,
  initialMaterial,
  isEditing,
  taskIndex,
  materialIndex,
  products: propProducts
}: MaterialModalProps) {
  // State for the material
  const [material, setMaterial] = useState<Partial<Material>>(initialMaterial);
  const [errors, setErrors] = useState<Partial<Record<keyof Material, string>>>({});
  
  // Product search for the dropdown - use prop products if provided, otherwise fetch
  const { data: fetchedProducts, isLoading: isLoadingProducts } = api.product.getAll.useQuery(
    { limit: 50 },
    { enabled: isOpen && !propProducts }
  );
  
  // Use either provided products or fetched products
  const products = propProducts || fetchedProducts?.items;
  
  // Reset the material when the modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setMaterial(initialMaterial);
      setErrors({});
    }
  }, [isOpen, initialMaterial]);
  
  // Handle field changes
  const handleChange = (field: keyof Material, value: any) => {
    setMaterial(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };
  
  // Handle product selection
  const handleProductSelect = (productId: string) => {
    if (!productId) {
      handleChange('productId', null);
      return;
    }
    
    const selectedProduct = products?.find(p => p.id === productId);
    if (selectedProduct) {
      const unitPrice = typeof selectedProduct.unitPrice === 'string' 
        ? parseFloat(selectedProduct.unitPrice) 
        : selectedProduct.unitPrice;
        
      setMaterial(prev => ({
        ...prev,
        productId: selectedProduct.id,
        name: selectedProduct.name,
        description: selectedProduct.description || '',
        unitPrice
      }));
    }
  };
  
  // Handle saving the material
  const handleSave = () => {
    // Validate required fields
    const newErrors: Partial<Record<keyof Material, string>> = {};
    
    if (!material.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!material.quantity || material.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    if (!material.unitPrice || material.unitPrice < 0) {
      newErrors.unitPrice = 'Price must be a positive number';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Save the material
    if (taskIndex !== null) {
      onSaveMaterial(
        {
          name: material.name!,
          quantity: material.quantity!,
          unitPrice: material.unitPrice!,
          productId: material.productId || null,
          description: material.description || '',
          notes: material.notes || null
        },
        taskIndex,
        materialIndex
      );
      
      // Close the modal
      onOpenChange(false);
    }
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      placement="center"
      size="lg"
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {isEditing ? 'Edit Material' : 'Add Material'}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {/* Product selection */}
                <div>
                  <SelectField
                    label="Select Product (Optional)"
                    placeholder="Search for a product"
                    value={material.productId || ''}
                    onChange={handleProductSelect}
                    options={products?.map(product => ({
                      label: product.name,
                      value: product.id
                    })) || []}
                    error={errors.productId}
                  />
                  {isLoadingProducts && (
                    <div className="flex items-center mt-2">
                      <Spinner size="sm" className="mr-2" />
                      <span className="text-sm text-muted-foreground">Loading products...</span>
                    </div>
                  )}
                </div>
                
                {/* Material name */}
                <TextField
                  label="Material Name"
                  placeholder="Enter material name"
                  value={material.name || ''}
                  onChange={(value) => handleChange('name', value)}
                  required
                  error={errors.name}
                />
                
                {/* Description */}
                <TextField
                  label="Description (Optional)"
                  placeholder="Enter material description"
                  value={material.description || ''}
                  onChange={(value) => handleChange('description', value)}
                  error={errors.description}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Quantity */}
                  <QuantityField
                    label="Quantity"
                    value={material.quantity || 0}
                    onChange={(value) => handleChange('quantity', value)}
                    min={1}
                    required
                    error={errors.quantity}
                  />
                  
                  {/* Unit Price */}
                  <CurrencyField
                    label="Unit Price"
                    value={material.unitPrice || 0}
                    onChange={(value) => handleChange('unitPrice', value)}
                    min={0}
                    required
                    error={errors.unitPrice}
                  />
                </div>
                
                {/* Notes */}
                <TextField
                  label="Notes (Optional)"
                  placeholder="Enter any additional notes"
                  value={material.notes || ''}
                  onChange={(value) => handleChange('notes', value)}
                  error={errors.notes}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleSave}>
                {isEditing ? 'Update' : 'Add'} Material
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

/**
 * A higher-order component that wraps MaterialModal with the useMaterialModal hook
 * for easier usage in components
 */
export function ConnectedMaterialModal({
  onSaveMaterial
}: {
  onSaveMaterial: (material: Omit<Material, 'id' | 'taskId'>, taskIndex: number, materialIndex?: number) => void;
}) {
  const {
    isOpen,
    initialMaterial,
    isEditing,
    closeMaterialModal,
    saveMaterial,
  } = useMaterialModal({ onSaveMaterial });
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeMaterialModal();
    }
  };
  
  return (
    <MaterialModal
      onSaveMaterial={saveMaterial}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      initialMaterial={initialMaterial}
      isEditing={isEditing}
      taskIndex={null}
      materialIndex={undefined}
    />
  );
} 