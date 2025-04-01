'use client';

import React, { useState } from 'react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '~/utils/api';
import { useRouter } from 'next/navigation';
import { CustomerSelect, type CustomerData } from '~/components/customers/CustomerSelect';
import { useToastStore } from '~/store';
import { useTranslation } from '~/hooks/useTranslation';

const getCreateQuoteSchema = (t: Function) => z.object({
  title: z.string().min(1, t('quotes.validation.titleRequired')),
  customerId: z.string().min(1, t('quotes.validation.customerRequired')),
  notes: z.string().optional().or(z.literal('')),
});

type CreateQuoteForm = z.infer<ReturnType<typeof getCreateQuoteSchema>>;

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newQuoteId: string) => void;
}

export function CreateQuoteModal({ isOpen, onClose, onSuccess }: CreateQuoteModalProps) {
  const router = useRouter();
  const toast = useToastStore();
  const { t } = useTranslation();

  // Get schema with translations by calling the function
  const createQuoteSchema = getCreateQuoteSchema(t);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateQuoteForm>({
    resolver: zodResolver(createQuoteSchema),
  });

  const customerId = watch('customerId');

  const createQuote = api.quote.create.useMutation({
    onSuccess: (newQuote) => {
      toast.success(`Quote "${newQuote.title}" created successfully`);
      reset();
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

  const onSubmit = (data: CreateQuoteForm) => {
    createQuote.mutate(data);
  };

  const handleCustomerChange = (id: string | null, customerData?: CustomerData) => {
    setValue('customerId', id || '');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Create New Quote</ModalHeader>
          <ModalBody>
            <Input
              label="Project Name"
              {...register('title')}
              errorMessage={errors.title?.message}
              isInvalid={!!errors.title}
            />
            <div className="space-y-1">
              <CustomerSelect
                value={customerId || null}
                onChange={handleCustomerChange}
              />
              {errors.customerId && (
                <p className="text-danger text-sm">{errors.customerId.message}</p>
              )}
            </div>
            <Textarea
              label="Notes"
              {...register('notes')}
              errorMessage={errors.notes?.message}
              isInvalid={!!errors.notes}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" type="submit" isLoading={createQuote.isPending}>
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
