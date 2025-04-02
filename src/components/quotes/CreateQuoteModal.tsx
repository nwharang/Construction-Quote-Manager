'use client';

import React, { useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
} from '@heroui/react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { api } from '~/utils/api';
import { CustomerSelector } from '~/components/customers/CustomerSelector';
import { useTranslation } from '~/hooks/useTranslation';
import { useAppToast } from '~/components/providers/ToastProvider';

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newQuoteId: string) => void;
}

function FieldInfo({ errors }: { errors?: { message: string }[] }) {
  const errorMessages = errors
    ?.map((e) => e.message)
    .filter((msg) => typeof msg === 'string' && msg.length > 0);

  return (
    <>
      {errorMessages && errorMessages.length > 0 ? (
        <p className="text-danger mt-1 text-xs">{errorMessages.join(', ')}</p>
      ) : null}
    </>
  );
}

export function CreateQuoteModal({ isOpen, onClose, onSuccess }: CreateQuoteModalProps) {
  const toast = useAppToast();
  const { t } = useTranslation();

  const createQuoteSchema = z.object({
    title: z.string().min(1, t('quotes.validation.titleRequired', { field: 'Title' })),
    customerId: z.string().min(1, t('quotes.validation.customerRequired', { field: 'Customer' })),
    notes: z.string(),
  });

  const createQuoteMutation = api.quote.create.useMutation({
    onSuccess: (newQuote) => {
      toast.success(`Quote "${newQuote.title}" created successfully`);
      form.reset();
      if (onSuccess) {
        onSuccess(newQuote.id);
      } else {
        onClose();
      }
    },
    onError: (error) => {
      toast.error(`Error creating quote: ${error.message}`);
    },
  });

  const form = useForm({
    defaultValues: {
      title: '',
      customerId: '',
      notes: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const submitValue = { ...value, notes: value.notes === '' ? null : value.notes };
        await createQuoteMutation.mutateAsync(submitValue);
      } catch (error) {
        console.error('Submission Error caught in onSubmit:', error);
      }
    },
    validators: {
      onChange: createQuoteSchema,
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => form.reset(), 150);
    }
  }, [isOpen, form]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
        <ModalContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex flex-col"
          >
            <ModalHeader className="text-lg font-semibold">Create New Quote</ModalHeader>
            <ModalBody className="space-y-4">
              <form.Field name="title">
                {(field) => (
                  <>
                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                      {t('quotes.fields.title')} <span className="text-danger">*</span>
                    </label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter quote title (e.g., Kitchen Remodel - Smith)"
                    />
                    <FieldInfo errors={field.state.meta.errors as { message: string }[]} />
                  </>
                )}
              </form.Field>

              <form.Field name="customerId">
                {(field) => (
                  <>
                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                      {t('quotes.fields.customer')} <span className="text-danger">*</span>
                    </label>
                    <CustomerSelector
                      value={field.state.value}
                      onChange={(id) => field.handleChange(id ?? '')}
                      placeholder={t('quotes.placeholders.selectCustomer')}
                      className="mt-1"
                    />
                    <FieldInfo errors={field.state.meta.errors as { message: string }[]} />
                  </>
                )}
              </form.Field>

              <form.Field name="notes">
                {(field) => (
                  <>
                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                      {t('quotes.fields.notes')}
                    </label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={t('quotes.placeholders.notes')}
                      className="mt-1"
                    />
                    <FieldInfo errors={field.state.meta.errors as { message: string }[]} />
                  </>
                )}
              </form.Field>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" color="default" onPress={onClose}>
                {t('button.cancel')}
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={form.state.isSubmitting}
                isDisabled={!form.state.isValid}
              >
                {t('button.create')}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
