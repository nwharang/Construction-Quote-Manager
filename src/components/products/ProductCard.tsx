import React from 'react';
import {
  Card,
  CardBody,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { Edit, Trash, MoreVertical, Package } from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from '~/hooks/useTranslation';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    category: string;
    unitPrice: string;
    description?: string | null;
  };
  onDelete: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete }) => {
  const router = useRouter();
  const { formatCurrency } = useTranslation();

  const handleEdit = () => {
    router.push(`/admin/products/${product.id}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      onDelete(product.id);
    }
  };

  return (
    <Card className="bg-card/50 border-border/50 border backdrop-blur-sm transition-all duration-200 hover:shadow-md">
      <CardBody className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/5 flex-shrink-0 rounded-lg p-2">
              <Package className="text-primary/80 h-5 w-5" />
            </div>
            <h3 className="text-foreground/90 text-lg font-medium">{product.name}</h3>
          </div>
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="light" aria-label="Product actions">
                <MoreVertical size={18} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Product actions">
              <DropdownItem key="edit" startContent={<Edit size={16} />} onPress={handleEdit}>
                Edit
              </DropdownItem>
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                startContent={<Trash size={16} />}
                onPress={handleDelete}
              >
                Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        {product.description && (
          <p className="text-muted-foreground/80 mb-3 line-clamp-2 text-sm">
            {product.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <Chip className="capitalize" color="primary" size="sm" variant="flat">
            {product.category.toLowerCase()}
          </Chip>
          <p className="text-lg font-semibold">{formatCurrency(Number(product.unitPrice))}</p>
        </div>
      </CardBody>
    </Card>
  );
};
