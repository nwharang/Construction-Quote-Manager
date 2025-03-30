import React from 'react';
import { Card, CardBody, CardHeader, Button } from '@heroui/react';
import { Plus } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';
import { TaskItem } from './TaskItem';
import type { Task, Material, Product } from '~/types/quote';

interface TaskListProps {
  tasks: Task[];
  products: Product[];
  handleTaskChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string,
    value?: string | number
  ) => void;
  handleNumberChange: (index: number, name: string, value: number) => void;
  addTask: () => void;
  removeTask: (index: number) => void;
  openMaterialModal: (taskIndex: number, materialIndex?: number) => void;
  removeMaterial: (taskIndex: number, materialIndex: number) => void;
  getMaterialDisplay: (material: Material) => { name: string; total: string };
  formatCurrency: (amount: number | string) => string;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  products,
  handleTaskChange,
  handleNumberChange,
  addTask,
  removeTask,
  openMaterialModal,
  removeMaterial,
  getMaterialDisplay,
  formatCurrency,
}) => {
  const { t } = useTranslation();

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tasks</h2>
          <Button color="primary" startContent={<Plus size={18} />} onPress={addTask}>
            Add Task
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground">
              No tasks added yet. Click &quot;Add Task&quot; to get started.
            </p>
          </div>
        ) : (
          <div>
            {tasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                index={index}
                products={products}
                handleTaskChange={handleTaskChange}
                handleNumberChange={handleNumberChange}
                removeTask={removeTask}
                openMaterialModal={openMaterialModal}
                removeMaterial={removeMaterial}
                getMaterialDisplay={getMaterialDisplay}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
