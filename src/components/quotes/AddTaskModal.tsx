"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
} from "@heroui/react";
import { api } from "~/utils/api";

// Form validation schema
const createTaskSchema = z.object({
  description: z.string().min(1, "Description is required"),
  price: z.string().min(1, "Price is required"),
  estimatedMaterialsCost: z.string().optional(),
  order: z.string().optional(),
});

type FormValues = z.infer<typeof createTaskSchema>;

export default function AddTaskModal({
  quoteId,
  isOpen,
  onClose,
}: {
  quoteId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const utils = api.useContext();
  
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      description: "",
      price: "",
      estimatedMaterialsCost: "",
      order: "",
    },
  });

  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      utils.quote.getById.invalidate({ id: quoteId });
      reset();
      onClose();
    },
    onError: (error) => {
      console.error("Error creating task:", error);
      // Set a form error to display to the user
      setError("root", { 
        type: "manual",
        message: error.message || "Failed to create task. Please try again."
      });
    }
  });

  const onSubmit = (data: FormValues) => {
    createTask.mutate({
      quoteId,
      description: data.description,
      price: parseFloat(data.price),
      estimatedMaterialsCost: data.estimatedMaterialsCost ? parseFloat(data.estimatedMaterialsCost) : undefined,
      order: data.order ? parseInt(data.order) : undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        {() => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader className="text-xl">Add Task</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {errors.root && (
                  <div className="text-red-500 p-2 mb-2 border border-red-300 rounded bg-red-50">
                    {errors.root.message}
                  </div>
                )}
                
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      label="Task Description"
                      placeholder="Describe the work to be done"
                      errorMessage={errors.description?.message}
                      isRequired
                    />
                  )}
                />

                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Task Price"
                      placeholder="Cost of labor/skill for this task"
                      type="number"
                      startContent={
                        <div className="pointer-events-none">$</div>
                      }
                      min={0}
                      step={0.01}
                      errorMessage={errors.price?.message}
                      isRequired
                    />
                  )}
                />

                <Controller
                  name="estimatedMaterialsCost"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Estimated Materials Cost"
                      placeholder="Estimated cost of materials"
                      type="number"
                      startContent={
                        <div className="pointer-events-none">$</div>
                      }
                      min={0}
                      step={0.01}
                      errorMessage={errors.estimatedMaterialsCost?.message}
                    />
                  )}
                />

                <Controller
                  name="order"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Display Order"
                      placeholder="Position in task list (0 = first)"
                      type="number"
                      min={0}
                      step={1}
                      errorMessage={errors.order?.message}
                    />
                  )}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                
                onPress={() => {
                  reset();
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={createTask.isPending}
              >
                Add Task
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
} 