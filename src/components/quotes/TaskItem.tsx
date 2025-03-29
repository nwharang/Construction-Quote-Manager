import React, { useEffect } from 'react';
import { Input, Textarea, RadioGroup, Radio, Button, Card, CardBody, NumberInput } from '@heroui/react';
import { Trash2, Edit, Plus } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';
import type { Material, Product, Task } from '~/types/quote';
import { api } from '~/utils/api';

interface TaskItemProps {
  task: Task;
  index: number;
  products: Product[];
  handleTaskChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  removeTask: (index: number) => void;
  openMaterialModal: (taskIndex: number, materialIndex?: number) => void;
  removeMaterial: (taskIndex: number, materialIndex: number) => void;
  getMaterialDisplay: (material: Material) => { name: string; total: string };
  formatCurrency: (amount: number) => string;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  index,
  products,
  handleTaskChange,
  removeTask,
  openMaterialModal,
  removeMaterial,
  getMaterialDisplay,
  formatCurrency,
}) => {
  const { t } = useTranslation();
  
  const handleRadioChange = (value: string) => {
    handleTaskChange(index, {
      target: {
        name: 'materialType',
        value,
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleNumberInputChange = (name: string, value: number) => {
    handleTaskChange(index, {
      target: {
        name,
        value: value.toString(),
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // Calculate task total for display
  const taskTotal = React.useMemo(() => {
    const taskPrice = task.price || 0;
    let materialsTotal = 0;
    
    if (task.materialType === 'lumpsum') {
      materialsTotal = task.estimatedMaterialsCostLumpSum || 0;
    } else if (task.materialType === 'itemized') {
      materialsTotal = task.materials.reduce((total, material) => {
        return total + ((material.unitPrice || 0) * (material.quantity || 0));
      }, 0);
    }
    
    return formatCurrency(taskPrice + materialsTotal);
  }, [task, formatCurrency]);

  return (
    <Card className="mb-4 border border-border/40">
      <CardBody className="p-4">
        <div className="relative">
          <Button
            isIconOnly
            color="danger"
            variant="light"
            className="absolute right-0 top-0"
            onPress={() => removeTask(index)}
            aria-label="Remove task"
          >
            <Trash2 size={18} />
          </Button>
          
          <div className="mb-4 space-y-4">
            <Textarea
              name="description"
              label="Task Description"
              placeholder="Describe the work to be done"
              value={task.description}
              onChange={(e) => handleTaskChange(index, e)}
              className="w-full"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberInput
                name="price"
                label="Task Price"
                placeholder="0.00"
                value={task.price}
                onValueChange={(value) => handleNumberInputChange('price', value as number)}
                startContent="$"
                min={0}
                step={0.01}
                formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                aria-label="Task Price"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Material Type</p>
            <RadioGroup 
              orientation="horizontal"
              value={task.materialType}
              onValueChange={handleRadioChange}
            >
              <Radio value="lumpsum">Lump Sum</Radio>
              <Radio value="itemized">Itemized Materials</Radio>
            </RadioGroup>
          </div>
          
          {task.materialType === 'lumpsum' ? (
            <div className="mb-4">
              <NumberInput
                name="estimatedMaterialsCostLumpSum"
                label="Estimated Materials Cost"
                placeholder="0.00"
                value={task.estimatedMaterialsCostLumpSum}
                onValueChange={(value) => handleNumberInputChange('estimatedMaterialsCostLumpSum', value as number)}
                startContent="$"
                min={0}
                step={0.01}
                formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                className="max-w-md"
                aria-label="Estimated Materials Cost"
              />
            </div>
          ) : (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-medium">Materials</h4>
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  startContent={<Plus size={16} />}
                  onPress={() => openMaterialModal(index)}
                >
                  Add Material
                </Button>
              </div>
              
              {task.materials.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg p-4 text-center text-muted-foreground">
                  No materials added yet. Click "Add Material" to add materials to this task.
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {task.materials.map((material, materialIndex) => {
                    const { name, total } = getMaterialDisplay(material);
                    return (
                      <div key={material.id} className="flex justify-between items-center p-3 bg-background rounded-lg border border-border/40">
                        <div>
                          <div className="font-medium">{name}</div>
                          <div className="text-sm text-muted-foreground">
                            {material.quantity} x {formatCurrency(material.unitPrice)} = {total}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => openMaterialModal(index, materialIndex)}
                            aria-label="Edit material"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            isIconOnly
                            color="danger"
                            variant="light"
                            size="sm"
                            onPress={() => removeMaterial(index, materialIndex)}
                            aria-label="Remove material"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end border-t border-border pt-3 mt-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Task Total:</div>
              <div className="text-lg font-semibold">{taskTotal}</div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}; 