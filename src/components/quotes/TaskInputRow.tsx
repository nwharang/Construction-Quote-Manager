import { Card, CardBody, CardHeader, Input, Button, NumberInput, Select, SelectItem } from '@heroui/react';
import { MaterialInputRow } from './MaterialInputRow';

export function TaskInputRow({ 
  task, 
  index, 
  onUpdate, 
  onRemove,
  onAddMaterial,
  onRemoveMaterial,
  onUpdateMaterial,
  readOnly = false
}: TaskInputRowProps) {
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(index, { ...task, description: e.target.value });
  };

  const handlePriceChange = (value: number) => {
    onUpdate(index, { ...task, price: value });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Task {index + 1}</h3>
          {!readOnly && (
            <Button color="danger" variant="ghost" onClick={() => onRemove(index)}>
              Remove Task
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <Input
            label="Description"
            value={task.description}
            onChange={handleDescriptionChange}
            isReadOnly={readOnly}
          />
          <NumberInput
            label="Price"
            value={task.price}
            onValueChange={handlePriceChange}
            min={0}
            step={0.01}
            formatOptions={{ 
              style: 'decimal', 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            }}
            startContent="$"
            isReadOnly={readOnly}
          />
          <Select
            label="Status"
            value={task.status}
            onChange={(e) => {
              onUpdate(index, { 
                ...task, 
                status: e.target.value as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
              });
            }}
            isDisabled={readOnly}
          >
            <SelectItem key="PENDING" textValue="PENDING">Pending</SelectItem>
            <SelectItem key="IN_PROGRESS" textValue="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem key="COMPLETED" textValue="COMPLETED">Completed</SelectItem>
          </Select>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium">Materials</h4>
              {!readOnly && (
                <div className="flex items-center gap-4">
                  <Select
                    label="Material Type"
                    value={task.materialType || 'itemized'}
                    onChange={(e) => {
                      const newType = e.target.value as 'itemized' | 'lumpsum';
                      onUpdate(index, { 
                        ...task, 
                        materialType: newType,
                        // Clear materials if switching to lumpsum
                        materials: newType === 'lumpsum' ? [] : task.materials
                      });
                    }}
                    isDisabled={readOnly}
                  >
                    <SelectItem key="itemized" textValue="itemized">Itemized</SelectItem>
                    <SelectItem key="lumpsum" textValue="lumpsum">Lump Sum</SelectItem>
                  </Select>
                  {task.materialType === 'itemized' && (
                    <Button color="primary" variant="ghost" onPress={() => onAddMaterial(index)}>
                      Add Material
                    </Button>
                  )}
                </div>
              )}
            </div>
            {task.materialType === 'lumpsum' ? (
              <NumberInput
                label="Estimated Materials Cost"
                value={task.estimatedMaterialsCostLumpSum || 0}
                onValueChange={(value) => {
                  onUpdate(index, { 
                    ...task, 
                    estimatedMaterialsCostLumpSum: value 
                  });
                }}
                min={0}
                step={0.01}
                formatOptions={{ 
                  style: 'decimal', 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                }}
                startContent="$"
                isReadOnly={readOnly}
              />
            ) : (
              task.materials.map((material: MaterialOutput, materialIndex: number) => (
                <MaterialInputRow
                  key={materialIndex}
                  material={material}
                  taskIndex={index}
                  materialIndex={materialIndex}
                  onUpdate={(taskIndex, materialIndex, material) => 
                    onUpdateMaterial(taskIndex, materialIndex, material)
                  }
                  onRemove={(taskIndex, materialIndex) => 
                    onRemoveMaterial(taskIndex, materialIndex)
                  }
                  readOnly={readOnly}
                />
              ))
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
} 