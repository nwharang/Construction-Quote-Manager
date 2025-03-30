import React from 'react';
import { 
  Card, 
  CardBody, 
  NumberInput, 
  Textarea, 
  RadioGroup, 
  Radio, 
  Button,
  Divider
} from '@heroui/react';
import { Trash2, Edit, Plus } from 'lucide-react';
import { formatCurrency } from '~/utils/currency';
import type { Material, Product, Task } from '~/types/quote';

interface TaskItemProps {
  task: Task;
  index: number;
  products: Product[];
  handleTaskChange: (
    index: number, 
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string,
    value?: string | number
  ) => void;
  handleNumberChange: (index: number, name: string, value: number) => void;
  removeTask: (index: number) => void;
  openMaterialModal: (taskIndex: number, materialIndex?: number) => void;
  removeMaterial: (taskIndex: number, materialIndex: number) => void;
  getMaterialDisplay?: (material: Material) => { name: string; total: string };
  formatCurrency?: (amount: number | string) => string;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  index,
  products,
  handleTaskChange,
  handleNumberChange,
  removeTask,
  openMaterialModal,
  removeMaterial,
  getMaterialDisplay,
  formatCurrency: formatCurrencyProp,
}) => {
  const currencyFormatter = formatCurrencyProp || formatCurrency;

  const handleRadioChange = (value: string) => {
    handleTaskChange(index, {
      target: {
        name: 'materialType',
        value,
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
    
    return taskPrice + materialsTotal;
  }, [task]);

  // Add materials rendering logic that uses getMaterialDisplay if provided
  const renderMaterialDisplay = (material: Material) => {
    if (getMaterialDisplay) {
      const display = getMaterialDisplay(material);
      return (
        <div>
          <div className="font-medium">{display.name}</div>
          <div className="text-sm text-muted-foreground">{display.total}</div>
        </div>
      );
    } else {
      const materialTotal = material.quantity * material.unitPrice;
      return (
        <div>
          <div className="font-medium">{material.name}</div>
          <div className="text-sm text-muted-foreground">
            {material.quantity} x {currencyFormatter(material.unitPrice)} = {currencyFormatter(materialTotal)}
          </div>
        </div>
      );
    }
  };

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
              label="Task Description"
              name="description"
              placeholder="Describe the work to be done"
              value={task.description}
              onChange={(e) => handleTaskChange(index, e)}
              className="w-full"
              minRows={2}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberInput
                label="Task Price"
                name="price"
                placeholder="0.00"
                value={task.price}
                onValueChange={(value) => handleNumberChange(index, 'price', value as number)}
                startContent="$"
                min={0}
                step={0.01}
                formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                className="w-full"
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
                label="Estimated Materials Cost"
                name="estimatedMaterialsCostLumpSum"
                placeholder="0.00"
                value={task.estimatedMaterialsCostLumpSum}
                onValueChange={(value) => handleNumberChange(index, 'estimatedMaterialsCostLumpSum', value as number)}
                startContent="$"
                min={0}
                step={0.01}
                formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                className="max-w-md"
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
                  {task.materials.map((material, materialIndex) => (
                    <div key={material.id} className="flex justify-between items-center p-3 bg-background rounded-lg border border-border/40">
                      {renderMaterialDisplay(material)}
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
                  ))}
                </div>
              )}
            </div>
          )}
          
          <Divider className="my-4" />
          
          <div className="flex justify-end">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Task Total:</div>
              <div className="text-lg font-semibold">{currencyFormatter(taskTotal)}</div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}; 