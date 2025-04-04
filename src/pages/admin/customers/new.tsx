import { useRouter } from 'next/router';
import { useState } from 'react';
import { 
  Button, 
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
} from '@heroui/react';
import { ArrowLeft, Save, ChevronRight } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from '~/hooks/useTranslation';
import { api } from '~/utils/api';
import { withMainLayout } from '~/utils/withAuth';
import { useAppToast } from '~/components/providers/ToastProvider';
import Link from 'next/link';

// Validation schema for customer form
const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

function NewCustomer() {
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useAppToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set up form with validation
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: null,
      phone: null,
      address: null,
      notes: null,
    },
  });

  // Create mutation
  const { mutate: createCustomer } = api.customer.create.useMutation({
    onSuccess: (data) => {
      toast.success(t('customers.createSuccess'));
      // Navigate to the newly created customer
      router.push(`/admin/customers/${data.id}/view`);
    },
    onError: (error) => {
      toast.error(error.message || t('customers.createError'));
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = (data: CustomerFormValues) => {
    setIsSubmitting(true);
    createCustomer(data);
  };

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
          <span className="text-sm font-medium text-gray-900">New Customer</span>
        </nav>
        
        <Button
          color="primary"
          variant="light"
          startContent={<ArrowLeft size={16} />}
          onPress={() => router.push('/admin/customers')}
        >
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">New Customer</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Name"
                      isRequired
                      isInvalid={!!errors.name}
                      errorMessage={errors.name?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </div>

              <div>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Email"
                      type="email"
                      isInvalid={!!errors.email}
                      errorMessage={errors.email?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </div>

              <div>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Phone"
                      isInvalid={!!errors.phone}
                      errorMessage={errors.phone?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </div>

              <div>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      label="Address"
                      isInvalid={!!errors.address}
                      errorMessage={errors.address?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </div>

              <div>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      label="Notes"
                      isInvalid={!!errors.notes}
                      errorMessage={errors.notes?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                color="primary"
                isLoading={isSubmitting}
                startContent={<Save size={16} />}
              >
                Create Customer
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default withMainLayout(NewCustomer); 