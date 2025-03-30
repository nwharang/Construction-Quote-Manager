import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Input, 
  NumberInput, 
  RadioGroup, 
  Radio,
  Button,
  Textarea
} from '@heroui/react';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '~/utils/currency';
import type { Task, Material } from '~/types/quote';

interface TaskFormProps {
  task: Partial<Task>;
  index: number;
  handleInputChange: (index: number, field: string, value: any) => void;
  handleRemoveTask: (index: number) => void;
  openMaterialModal: (taskIndex: number, materialIndex?: number) => void;
  handleRemoveMaterial: (taskIndex: number, materialIndex: number) => void;
}

/**
 * Component for adding and editing tasks in a quote
 */
export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  index,
  handleInputChange,
  handleRemoveTask,
  openMaterialModal,
  handleRemoveMaterial
}) => {
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleInputChange(index, e.target.name, e.target.value);
  };
  
  // Handle number input changes
  const handleNumberChange = (name: string, value: number) => {
    handleInputChange(index, name, value);
  };
  
  // Handle radio input changes
  const handleRadioChange = (value: string) => {
    handleInputChange(index, 'materialType', value);
  };

  // Calculate task price
  const taskPrice = task.price || 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center px-6 py-4">
        <h3 className="text-xl font-semibold">Task {index + 1}</h3>
        <Button 
          color="danger" 
          variant="ghost" 
          isIconOnly 
          size="sm"
          onClick={() => handleRemoveTask(index)}
          aria-label={`Remove task ${index + 1}`}
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardBody className="px-6 py-4 space-y-4">
        <div className="space-y-4">
          <Textarea
            label="Task Description"
            name="description"
            value={task.description || ''}
            onChange={handleChange}
            placeholder="Describe the task in detail"
            required
          />
          
          <NumberInput
            label="Price"
            name="price"
            value={taskPrice}
            onValueChange={(value) => handleNumberChange('price', value as number)}
            startContent="$"
            min={0}
            step={0.01}
            className="max-w-xs"
            formatOptions={{ 
              style: 'decimal', 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            }}
          />
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Materials</p>
            <RadioGroup
              label="Material Type"
              orientation="horizontal"
              value={task.materialType || 'lumpsum'}
              onValueChange={handleRadioChange}
            >
              <Radio value="lumpsum">Lump Sum</Radio>
              <Radio value="itemized">Itemized</Radio>
            </RadioGroup>
            
            {task.materialType === 'lumpsum' ? (
              <NumberInput
                label="Estimated Materials Cost"
                name="estimatedMaterialsCostLumpSum"
                value={task.estimatedMaterialsCostLumpSum || 0}
                onValueChange={(value) => 
                  handleNumberChange('estimatedMaterialsCostLumpSum', value as number)
                }
                startContent="$"
                min={0}
                step={0.01}
                className="max-w-xs"
                formatOptions={{ 
                  style: 'decimal', 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                }}
              />
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm">Materials List</p>
                  <Button 
                    color="primary" 
                    variant="flat" 
                    size="sm"
                    startContent={<Plus className="w-4 h-4" />}
                    onClick={() => openMaterialModal(index)}
                  >
                    Add Material
                  </Button>
                </div>
                
                {task.materials && task.materials.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {task.materials.map((material, materialIndex) => (
                      <MaterialListItem
                        key={material.id || materialIndex}
                        material={material}
                        taskIndex={index}
                        materialIndex={materialIndex}
                        onEdit={openMaterialModal}
                        onRemove={handleRemoveMaterial}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No materials added yet. Click "Add Material" to add materials to this task.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

interface MaterialListItemProps {
  material: Material;
  taskIndex: number;
  materialIndex: number;
  onEdit: (taskIndex: number, materialIndex: number) => void;
  onRemove: (taskIndex: number, materialIndex: number) => void;
}

/**
 * Component for displaying a material in the task form
 */
const MaterialListItem: React.FC<MaterialListItemProps> = ({
  material,
  taskIndex,
  materialIndex,
  onEdit,
  onRemove
}) => {
  const totalPrice = formatCurrency(material.quantity * material.unitPrice);
  
  return (
    <div className="flex justify-between items-center p-3 border rounded-md bg-background hover:bg-content1">
      <div className="flex-1">
        <p className="font-medium truncate">{material.name}</p>
        <p className="text-sm text-muted-foreground">{material.quantity} × {formatCurrency(material.unitPrice)} = {totalPrice}</p>
      </div>
      <div className="flex gap-2">
        <Button
          color="primary"
          variant="light"
          isIconOnly
          size="sm"
          onClick={() => onEdit(taskIndex, materialIndex)}
          aria-label={`Edit ${material.name}`}
        >
          <span className="text-xs">Edit</span>
        </Button>
        <Button
          color="danger"
          variant="light"
          isIconOnly
          size="sm"
          onClick={() => onRemove(taskIndex, materialIndex)}
          aria-label={`Remove ${material.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}; 