import { useRouter } from 'next/router';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Button,
  Spinner,
  Divider,
} from '@heroui/react';
import { ArrowLeft, Edit, Trash } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';
import { CustomerQuotes } from '~/components/customers/CustomerQuotes';
import { api } from '~/utils/api';
import { withMainLayout } from '~/utils/withAuth';
import { useAppToast } from '~/components/providers/ToastProvider';
import { DeleteEntityDialog } from '~/components/shared/DeleteEntityDialog';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

function CustomerDetail() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { t, formatDate } = useTranslation();
  const toast = useAppToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: customer, isLoading } = api.customer.getById.useQuery(
    { id },
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  );

  const { mutate: deleteCustomer } = api.customer.delete.useMutation({
    onSuccess: () => {
      toast.success(t('customers.deleteSuccess'));
      router.push('/admin/customers');
    },
    onError: (error) => {
      toast.error(error.message || t('customers.deleteError'));
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });

  const handleDelete = async (): Promise<void> => {
    if (id) {
      setIsDeleting(true);
      return new Promise<void>((resolve) => {
        deleteCustomer({ id });
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

  if (!customer) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">Customer not found</h2>
        <Button
          color="primary"
          variant="light"
          className="mt-4"
          startContent={<ArrowLeft size={16} />}
          onPress={() => router.push('/admin/customers')}
        >
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <nav className="flex items-center">
          <Link 
            href="/admin/customers" 
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            Customers
          </Link>
          <ChevronRight size={16} className="mx-2 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {customer?.name || 'Customer Details'}
          </span>
        </nav>
        
        <div className="flex gap-2">
          <Button
            color="primary"
            variant="light"
            startContent={<ArrowLeft size={16} />}
            onPress={() => router.push('/admin/customers')}
          >
            Back
          </Button>
          <Button
            color="primary"
            variant="flat"
            startContent={<Edit size={16} />}
            onPress={() => router.push(`/admin/customers/${id}/edit`)}
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
          <h2 className="text-2xl font-bold">{customer.name}</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Contact Information</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Email:</span>{' '}
                  {customer.email || 'Not provided'}
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{' '}
                  {customer.phone || 'Not provided'}
                </p>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Address</h3>
              <p className="whitespace-pre-wrap">{customer.address || 'Not provided'}</p>
            </div>
          </div>

          <Divider className="my-6" />

          {customer.notes && (
            <>
              <div>
                <h3 className="mb-2 text-lg font-semibold">Notes</h3>
                <p className="whitespace-pre-wrap">{customer.notes}</p>
              </div>
              <Divider className="my-6" />
            </>
          )}

          <div className="text-sm text-gray-500">
            <p>Created at: {formatDate(customer.createdAt)}</p>
            <p>Updated at: {formatDate(customer.updatedAt)}</p>
            {customer.creatorName && (
              <p>Created by: {customer.creatorName}</p>
            )}
          </div>
        </CardBody>
      </Card>

      <CustomerQuotes customerId={id} />

      <DeleteEntityDialog
        entityName="customer"
        entityLabel={customer.name}
        isOpen={isDeleteDialogOpen}
        isLoading={isDeleting}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default withMainLayout(CustomerDetail); 