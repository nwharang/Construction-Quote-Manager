import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { 
  Button, 
  Spinner,
  Card,
  CardHeader,
  CardBody,
  Input,
  Textarea,
  Divider
} from '@heroui/react';
import { api } from '~/utils/api';
import { useCustomers } from '~/contexts/CustomersContext';

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = router.query;
  const { status } = useSession();
  const { 
    customerFormData, 
    setCustomerFormData, 
    updateCustomer, 
    isSubmitting, 
    fetchCustomerById, 
    loading 
  } = useCustomers();

  // Fetch customer when component mounts
  useEffect(() => {
    if (id && typeof id === 'string' && status === 'authenticated') {
      fetchCustomerById(id);
    }
  }, [id, status]);

  const handleChange = (field: keyof typeof customerFormData, value: string) => {
    setCustomerFormData({ [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id && typeof id === 'string') {
      const success = await updateCustomer(id);
      if (success) {
        router.push('/admin/customers');
      }
    }
  };

  // Not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Loading customer data
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

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
              <p className="text-muted-foreground">Update customer's information</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto w-full">
            <Card className="border-none shadow-none">
              <CardHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">Customer Information</h2>
              </CardHeader>
              <CardBody className="border-none">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <Input
                      label="Name"
                      placeholder="Enter customer name"
                      value={customerFormData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                      radius="none"
                      classNames={{
                        inputWrapper: "border-none"
                      }}
                    />

                    <Input
                      label="Email"
                      type="email"
                      placeholder="Enter customer email"
                      value={customerFormData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      radius="none"
                      classNames={{
                        inputWrapper: "border-none"
                      }}
                    />

                    <Input
                      label="Phone"
                      placeholder="Enter customer phone"
                      value={customerFormData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      radius="none"
                      classNames={{
                        inputWrapper: "border-none"
                      }}
                    />

                    <Input
                      label="Address"
                      placeholder="Enter customer address"
                      value={customerFormData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      radius="none"
                      classNames={{
                        inputWrapper: "border-none"
                      }}
                    />

                    <Textarea
                      label="Notes"
                      placeholder="Enter any additional notes"
                      value={customerFormData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      radius="none"
                      classNames={{
                        inputWrapper: "border-none"
                      }}
                    />

                    <Divider className="my-4" />

                    <div className="flex justify-end gap-2">
                      <Button
                        color="default"
                        variant="flat"
                        onPress={() => router.push('/admin/customers')}
                      >
                        Cancel
                      </Button>

                      <Button
                        color="primary"
                        type="submit"
                        isLoading={isSubmitting}
                      >
                        Update Customer
                      </Button>
                    </div>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
} 