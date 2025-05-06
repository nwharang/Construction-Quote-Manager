import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
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
import { Breadcrumb } from '~/components/shared/Breadcrumb';
import type { BreadcrumbItem } from '~/components/shared/Breadcrumb';

// Validation schema for customer form
const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const CreateCustomerPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
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

  // Define submit handler
  const onSubmit = (data: CustomerFormValues) => {
    setIsSubmitting(true);
    createCustomer(data);
  };

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

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t('nav.dashboard'), href: '/admin/dashboard' },
    { label: t('breadcrumb.customers.list'), href: '/admin/customers' },
    { label: t('breadcrumb.customers.new'), href: '/admin/customers/new', isCurrent: true },
  ];

  return (
    <>
      <Head>
        <title>{t('customers.new')}</title>
      </Head>

      <div className="space-y-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="flex items-center justify-between">
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
            <h2 className="text-2xl font-bold">{t('customers.new.header')}</h2>
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
                        label={t('customers.form.nameLabel')}
                        placeholder={t('customers.placeholders.name')}
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
                        label={t('customers.form.emailLabel')}
                        placeholder={t('customers.placeholders.email')}
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
                        label={t('customers.form.phoneLabel')}
                        placeholder={t('customers.placeholders.phone')}
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
                        label={t('customers.form.addressLabel')}
                        placeholder={t('customers.placeholders.address')}
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
                        label={t('customers.form.notesLabel')}
                        placeholder={t('customers.placeholders.notes')}
                        isInvalid={!!errors.notes}
                        errorMessage={errors.notes?.message}
                        value={field.value || ''}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  color="default"
                  variant="flat"
                  onPress={() => router.back()}
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  isLoading={isSubmitting}
                  startContent={<Save size={16} />}
                >
                  {t('customers.form.createButton')}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default withMainLayout(CreateCustomerPage); 