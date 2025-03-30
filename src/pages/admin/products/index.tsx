import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { api } from '~/utils/api';
import { Layout } from '~/components/Layout';
import { EntityList, type EntityColumn } from '~/components/shared/EntityList';
import { useEntityStore, useToastStore } from '~/store';
import { formatCurrency } from '~/utils/currency';
import { formatUserFriendlyId } from '~/utils/formatters';
import type { Product } from '~/types/quote';

// API product type may have unitPrice as string
interface ApiProduct extends Omit<Product, 'unitPrice'> {
  unitPrice: string | number;
}

const ProductsPage: NextPage = () => {
  const router = useRouter();
  const toast = useToastStore();
  const entityStore = useEntityStore();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // Set global entity settings for the EntityList component
  useEffect(() => {
    entityStore.setEntitySettings({
      entityName: 'Products',
      entityType: 'products',
      baseUrl: '/admin/products',
      displayNameField: 'name',
      canView: true,
      canEdit: true,
      canDelete: true,
      listPath: '/admin/products',
      createPath: '/admin/products/new',
      editPath: '/admin/products/:id/edit',
      viewPath: '/admin/products/:id',
    });
    
    // Clean up
    return () => entityStore.resetEntitySettings();
  }, []);
  
  // Query for products
  const { data, isLoading } = api.product.getAll.useQuery({});
  
  // Convert data to Product type
  const products: Product[] = data?.items 
    ? data.items.map((product: ApiProduct) => ({
        ...product,
        unitPrice: typeof product.unitPrice === 'string' 
          ? parseFloat(product.unitPrice) 
          : product.unitPrice
      })) as Product[] 
    : [];
  
  // Delete mutation
  const deleteMutation = api.product.delete.useMutation({
    onSuccess: () => {
      toast.success('Product deleted successfully');
      api.useContext().product.getAll.invalidate();
      closeDeleteModal();
    },
    onError: (error) => {
      toast.error(`Error deleting product: ${error.message}`);
    }
  });
  
  // Handlers
  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };
  
  const confirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate({ id: productToDelete.id });
    }
  };
  
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setProductToDelete(null);
  };
  
  // Column definitions
  const columns: EntityColumn<Product>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (product) => <span className="font-mono text-xs">{formatUserFriendlyId(product.id, product.sequentialId)}</span>
    },
    {
      key: 'name',
      label: 'Name',
      render: (product) => (
        <div className="flex flex-col">
          <span className="font-medium">{product.name}</span>
          {product.description && (
            <span className="text-xs text-muted-foreground line-clamp-1">{product.description}</span>
          )}
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (product) => <span>{product.category}</span>
    },
    {
      key: 'unitPrice',
      label: 'Unit Price',
      render: (product) => <span>{formatCurrency(product.unitPrice)}</span>
    }
  ];
  
  return (
    <Layout>
      <div className="p-6">
        <EntityList<Product>
          title="Products"
          entities={products}
          columns={columns}
          baseUrl="/admin/products"
          isLoading={isLoading}
          onDelete={handleDelete}
        />
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={closeDeleteModal} backdrop="blur">
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalBody>
            {productToDelete && (
              <p>
                Are you sure you want to delete the product &quot;{productToDelete.name}&quot;? 
                This action cannot be undone.
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closeDeleteModal}>
              Cancel
            </Button>
            <Button 
              color="danger" 
              onPress={confirmDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default ProductsPage;
