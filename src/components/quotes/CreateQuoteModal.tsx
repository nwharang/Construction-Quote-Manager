"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
} from "@nextui-org/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "~/utils/api";
import { useRouter } from "next/navigation";

const createQuoteSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type CreateQuoteForm = z.infer<typeof createQuoteSchema>;

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateQuoteModal({ isOpen, onClose }: CreateQuoteModalProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateQuoteForm>({
    resolver: zodResolver(createQuoteSchema),
  });

  const createQuote = api.quotes.create.useMutation({
    onSuccess: () => {
      reset();
      onClose();
      router.refresh();
    },
  });

  const onSubmit = (data: CreateQuoteForm) => {
    createQuote.mutate(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Create New Quote</ModalHeader>
          <ModalBody>
            <Input
              label="Project Name"
              {...register("projectName")}
              errorMessage={errors.projectName?.message}
              isInvalid={!!errors.projectName}
            />
            <Input
              label="Customer Name"
              {...register("customerName")}
              errorMessage={errors.customerName?.message}
              isInvalid={!!errors.customerName}
            />
            <Input
              label="Customer Email"
              type="email"
              {...register("customerEmail")}
              errorMessage={errors.customerEmail?.message}
              isInvalid={!!errors.customerEmail}
            />
            <Input
              label="Customer Phone"
              {...register("customerPhone")}
              errorMessage={errors.customerPhone?.message}
              isInvalid={!!errors.customerPhone}
            />
            <Textarea
              label="Notes"
              {...register("notes")}
              errorMessage={errors.notes?.message}
              isInvalid={!!errors.notes}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={createQuote.isPending}
            >
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
} 