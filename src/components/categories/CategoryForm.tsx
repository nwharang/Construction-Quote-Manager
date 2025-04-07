import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, CardBody, Input, Textarea } from '@heroui/react';
import { Save } from 'lucide-react';

import { useTranslation } from '~/hooks/useTranslation';
import { useToastStore } from '~/store';

// Define the form schema using Zod
const categoryFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
});

// TypeScript type for the form data
export type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  initialData?: CategoryFormData;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function CategoryForm({ initialData, onSubmit, isSubmitting }: CategoryFormProps) {
  const { t } = useTranslation();
  const { error: showErrorToast } = useToastStore();

  // Initialize form with react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
    },
  });

  // Handle form submission
  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      showErrorToast((error as Error)?.message || t('common.error'));
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Card>
        <CardBody className="gap-4">
          {/* Name field */}
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label={t('categories.list.name')}
                isRequired
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
              />
            )}
          />

          {/* Description field */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                label={t('categories.list.description')}
                isInvalid={!!errors.description}
                errorMessage={errors.description?.message}
                minRows={3}
              />
            )}
          />

          {/* Submit button */}
          <div className="mt-4 flex justify-end">
            <Button
              color="primary"
              type="submit"
              isLoading={isSubmitting}
              startContent={!isSubmitting && <Save size={16} />}
            >
              {initialData ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </CardBody>
      </Card>
    </form>
  );
} 