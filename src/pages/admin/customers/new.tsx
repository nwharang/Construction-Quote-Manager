import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@heroui/react';
import { CustomerForm } from '~/components/customers/CustomerForm';
import { api } from '~/utils/api';
import type { z } from 'zod';
import type { customerSchema } from '~/components/customers/CustomerForm';

type CustomerFormData = z.infer<typeof customerSchema>;

export default function NewCustomerPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const createCustomerMutation = api.customer.create.useMutation({
    onSuccess: () => {
      router.push('/admin/customers');
    },
  });

  // Not authenticated
  if (authStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const handleSubmit = async (data: CustomerFormData) => {
    await createCustomerMutation.mutateAsync(data);
  };

  return (
    <>
      <Head>
        <title>New Customer | Construction Quote Manager</title>
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
              <h1 className="text-2xl font-bold text-foreground">New Customer</h1>
              <p className="text-muted-foreground">Create a new customer profile</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto w-full">
            <CustomerForm
              onSubmit={handleSubmit}
              isLoading={createCustomerMutation.isPending}
            />
          </div>
        </div>
      </div>
    </>
  );
} 