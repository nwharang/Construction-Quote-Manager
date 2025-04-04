import { useRouter } from 'next/router';
import { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Button,
  Spinner,
  Divider,
  Chip,
} from '@heroui/react';
import { ArrowLeft, Edit, Trash, ChevronRight } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';
import { api } from '~/utils/api';
import { withMainLayout } from '~/utils/withAuth';
import { useAppToast } from '~/components/providers/ToastProvider';
import { DeleteEntityDialog } from '~/components/shared/DeleteEntityDialog';
import Link from 'next/link';

function ProductDetail() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { t, formatDate, formatCurrency } = useTranslation();
  const toast = useAppToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: product, isLoading } = api.product.getById.useQuery(
    { id },
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  );

  const { mutate: deleteProduct } = api.product.delete.useMutation({
    onSuccess: () => {
      toast.success(t('products.deleteSuccess'));
      router.push('/admin/products');
    },
    onError: (error) => {
      toast.error(error.message || t('products.deleteError'));
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });

  const handleDelete = async (): Promise<void> => {
    if (id) {
      setIsDeleting(true);
      return new Promise<void>((resolve) => {
        deleteProduct({ id });
        // We resolve immediately but UI will wait for onSettled to hide loading state
        resolve();
      });
    }
    return Promise.resolve();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">Product not found</h2>
        <Button
          color="primary"
          variant="light"
          className="mt-4"
          startContent={<ArrowLeft size={16} />}
          onPress={() => router.push('/admin/products')}
        >
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <nav className="flex items-center">
          <Link 
            href="/admin/products" 
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            Products
          </Link>
          <ChevronRight size={16} className="mx-2 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {product?.name || 'Product Details'}
          </span>
        </nav>
        
        <div className="flex gap-2">
          <Button
            color="primary"
            variant="light"
            startContent={<ArrowLeft size={16} />}
            onPress={() => router.push('/admin/products')}
          >
            Back
          </Button>
          <Button
            color="primary"
            variant="flat"
            startContent={<Edit size={16} />}
            onPress={() => router.push(`/admin/products/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            color="danger"
            variant="flat"
            startContent={<Trash size={16} />}
            onPress={() => setIsDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">{product.name}</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Product Information</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Price:</span>{' '}
                  {formatCurrency(product.unitPrice)}
                </p>
                <p>
                  <span className="font-medium">Unit:</span>{' '}
                  {product.unit || 'Not specified'}
                </p>
                <p>
                  <span className="font-medium">SKU:</span>{' '}
                  {product.sku || 'Not specified'}
                </p>
                <p>
                  <span className="font-medium">Category:</span>{' '}
                  {product.categoryName || 'None'}
                </p>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Additional Details</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Location:</span>{' '}
                  {product.location || 'Not specified'}
                </p>
                <p>
                  <span className="font-medium">Manufacturer:</span>{' '}
                  {product.manufacturer || 'Not specified'}
                </p>
                <p>
                  <span className="font-medium">Supplier:</span>{' '}
                  {product.supplier || 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {product.description && (
            <>
              <Divider className="my-6" />
              <div>
                <h3 className="mb-2 text-lg font-semibold">Description</h3>
                <p className="whitespace-pre-wrap">{product.description}</p>
              </div>
            </>
          )}

          {product.notes && (
            <>
              <Divider className="my-6" />
              <div>
                <h3 className="mb-2 text-lg font-semibold">Notes</h3>
                <p className="whitespace-pre-wrap">{product.notes}</p>
              </div>
            </>
          )}

          <Divider className="my-6" />
          <div className="text-sm text-gray-500">
            <p>Created at: {formatDate(product.createdAt)}</p>
            <p>Updated at: {formatDate(product.updatedAt)}</p>
            {product.creatorName && (
              <p>Created by: {product.creatorName}</p>
            )}
          </div>
        </CardBody>
      </Card>

      <DeleteEntityDialog
        entityName="product"
        entityLabel={product.name}
        isOpen={isDeleteDialogOpen}
        isLoading={isDeleting}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default withMainLayout(ProductDetail); 