import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { CustomerForm } from '~/components/customers/CustomerForm';
import { api } from '~/utils/api';
import type { z } from 'zod';
import type { customerSchema } from '~/components/customers/CustomerForm';

type CustomerFormData = z.infer<typeof customerSchema>;

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: authStatus } = useSession();

  // Fetch customer data
  const { data: customer, isLoading: isLoadingCustomer } = api.customer.getById.useQuery(
    { id: id as string },
    { enabled: !!id && authStatus === 'authenticated' }
  );

  // Update customer mutation
  const updateCustomerMutation = api.customer.update.useMutation({
    onSuccess: () => {
      router.push('/admin/customers');
    },
  });

  // Not authenticated
  if (authStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Loading customer data
  if (isLoadingCustomer) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  // Customer not found
  if (!customer) {
    return (
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-2xl font-bold text-foreground mb-2">Customer Not Found</h1>
          <p className="text-muted-foreground">The customer you&apos;re looking for doesn&apos;t exist.</p>
          <Button
            color="primary"
            className="mt-4"
            onPress={() => router.push('/admin/customers')}
          >
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: CustomerFormData) => {
    await updateCustomerMutation.mutateAsync({
      id: customer.id,
      ...data,
    });
  };

  return (
    <>
      <Head>
        <title>Edit Customer | Construction Quote Manager</title>
      </Head>

      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              variant="light"
              onPress={() => router.back()}
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Edit Customer</h1>
              <p className="text-muted-foreground">Update customer&apos;s information</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto w-full">
            <CustomerForm
              customer={customer}
              onSubmit={handleSubmit}
              isLoading={updateCustomerMutation.isPending}
            />
          </div>
        </div>
      </div>
    </>
  );
} 