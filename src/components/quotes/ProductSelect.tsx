import { Autocomplete, AutocompleteItem } from '@heroui/react';
import type { Product } from '~/types/quote';

interface ProductSelectProps {
  products: Product[];
  value?: string;
  onChange: (productId: string) => void;
  label?: string;
  placeholder?: string;
}

export const ProductSelect: React.FC<ProductSelectProps> = ({
  products,
  value,
  onChange,
  label = 'Product',
  placeholder = 'Select a product',
}) => {
  return (
    <Autocomplete
      label={label}
      placeholder={placeholder}
      value={value}
      onSelectionChange={(key) => onChange(key as string)}
      items={products}
      className="w-full"
    >
      {(product) => (
        <AutocompleteItem key={product.id} textValue={product.name}>
          {product.name} - ${Number(product.unitPrice).toFixed(2)}
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
}; 