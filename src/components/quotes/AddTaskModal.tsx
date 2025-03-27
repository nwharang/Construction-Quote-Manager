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
import { useState } from "react";

const createTaskSchema = z.object({
  description: z.string().min(1, "Description is required"),
  taskPrice: z.string().transform((val) => Number(val)),
  estimatedMaterialsCostLumpSum: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  order: z.string().transform((val) => Number(val)),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

interface AddTaskModalProps {
  quoteId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddTaskModal({
  quoteId,
  isOpen,
  onClose,
}: AddTaskModalProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
  });

  const addTask = api.quotes.addTask.useMutation({
    onSuccess: () => {
      reset();
      onClose();
      router.refresh();
    },
  });

  const onSubmit = (data: CreateTaskForm) => {
    addTask.mutate({
      quoteId,
      ...data,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Add Task</ModalHeader>
          <ModalBody>
            <Textarea
              label="Description"
              {...register("description")}
              errorMessage={errors.description?.message}
              isInvalid={!!errors.description}
            />
            <Input
              label="Task Price"
              type="number"
              step="0.01"
              {...register("taskPrice")}
              errorMessage={errors.taskPrice?.message}
              isInvalid={!!errors.taskPrice}
            />
            <Input
              label="Estimated Materials Cost (Optional)"
              type="number"
              step="0.01"
              {...register("estimatedMaterialsCostLumpSum")}
              errorMessage={errors.estimatedMaterialsCostLumpSum?.message}
              isInvalid={!!errors.estimatedMaterialsCostLumpSum}
            />
            <Input
              label="Order"
              type="number"
              {...register("order")}
              errorMessage={errors.order?.message}
              isInvalid={!!errors.order}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={addTask.isPending}
            >
              Add Task
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
} 