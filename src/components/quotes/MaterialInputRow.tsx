import { Card, CardBody, CardHeader, Input, Button, NumberInput } from '@heroui/react';
import type { MaterialInputRowProps } from '~/types/quote';

export function MaterialInputRow({
  material,
  taskIndex,
  materialIndex,
  onUpdate,
  onRemove,
  readOnly = false
}: MaterialInputRowProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(taskIndex, materialIndex, { ...material, name: e.target.value });
  };

  const handleQuantityChange = (value: number) => {
    onUpdate(taskIndex, materialIndex, { ...material, quantity: value });
  };

  const handleUnitPriceChange = (value: number) => {
    onUpdate(taskIndex, materialIndex, { ...material, unitPrice: value });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(taskIndex, materialIndex, { ...material, notes: e.target.value });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium">Material {materialIndex + 1}</h4>
          {!readOnly && (
            <Button color="danger" variant="ghost" onClick={() => onRemove(taskIndex, materialIndex)}>
              Remove Material
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <Input
            label="Name"
            value={material.name}
            onChange={handleNameChange}
            isReadOnly={readOnly}
          />
          <NumberInput
            label="Quantity"
            value={material.quantity}
            onValueChange={handleQuantityChange}
            min={1}
            step={1}
            formatOptions={{ 
              style: 'decimal', 
              maximumFractionDigits: 0 
            }}
            isReadOnly={readOnly}
          />
          <NumberInput
            label="Unit Price"
            value={material.unitPrice}
            onValueChange={handleUnitPriceChange}
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
          <Input
            label="Notes"
            value={material.notes || ''}
            onChange={handleNotesChange}
            isReadOnly={readOnly}
          />
        </div>
      </CardBody>
    </Card>
  );
} 