import React from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Button,
  Input,
  NumberInput,
  Select,
  SelectItem,
  Textarea
} from '@heroui/react';
import type { Material, Product } from '~/types/quote';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  material: Material;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: string | number } }) => void;
  onSave: () => void;
}

export function MaterialModal({
  isOpen,
  onClose,
  products,
  material,
  handleChange,
  onSave,
}: MaterialModalProps) {
  const handleQuantityChange = (value: number) => {
    handleChange({
      target: {
        name: 'quantity',
        value
      }
    });
  };

  const handleUnitPriceChange = (value: number) => {
    handleChange({
      target: {
        name: 'unitPrice',
        value
      }
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      placement="center"
      size="lg"
    >
      <ModalContent>
        <ModalHeader>
          {material.id ? 'Edit Material' : 'Add Material'}
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-4">
            <Select
              label="Product"
              name="productId"
              value={material.productId}
              onChange={(e) => handleChange(e)}
              placeholder="Select a product"
              required
            >
              {products.map((product) => (
                <SelectItem key={product.id} textValue={product.name}>
                  {product.name} (${product.unitPrice.toFixed(2)})
                </SelectItem>
              ))}
            </Select>
            
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="Quantity"
                name="quantity"
                value={material.quantity}
                onValueChange={handleQuantityChange}
                min={1}
                step={1}
                aria-label="Material Quantity"
              />
              
              <NumberInput
                label="Unit Price"
                name="unitPrice"
                value={material.unitPrice}
                onValueChange={handleUnitPriceChange}
                startContent="$"
                formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                min={0}
                step={0.01}
                aria-label="Material Unit Price"
              />
            </div>
            
            <Textarea
              label="Notes"
              name="notes"
              value={material.notes}
              onChange={(e) => handleChange(e)}
              placeholder="Optional notes about this material"
            />
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={onSave}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 