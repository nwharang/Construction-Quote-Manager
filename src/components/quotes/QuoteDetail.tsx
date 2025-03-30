'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Button,
  Chip,
  Input,
  Badge,
  NumberInput,
} from '@heroui/react';
import { api } from '~/utils/api';

// Define the Quote type structure
interface Task {
  id: string;
  description: string;
  price: string | number;
  estimatedMaterialsCost: string | number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  quote_id?: string;
}

interface Material {
  id: string;
  name: string;
  cost: string | number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Quote {
  id: string;
  projectName: string;
  customerName: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  complexityCharge: string | number;
  markupPercentage: string | number;
  createdAt: Date;
  updatedAt: Date;
  customerEmail?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  tasks: Task[];
}

// Status color mapping
const statusColors = {
  DRAFT: 'default',
  SENT: 'primary',
  ACCEPTED: 'success',
  REJECTED: 'danger',
} as const;

export default function QuoteDetail({ quote }: { quote: Quote }) {
  const router = useRouter();
  const utils = api.useContext();

  const [complexityCharge, setComplexityCharge] = useState(Number(quote.complexityCharge));
  const [markupPercentage, setMarkupPercentage] = useState(Number(quote.markupPercentage));

  const updateCharges = api.quote.updateCharges.useMutation({
    onSuccess: () => {
      utils.quote.getById.invalidate({ id: quote.id });
    },
  });

  const updateStatus = api.quote.updateStatus.useMutation({
    onSuccess: () => {
      utils.quote.getById.invalidate({ id: quote.id });
    },
  });

  const deleteQuote = api.quote.delete.useMutation({
    onSuccess: () => {
      router.push('/quotes');
    },
  });

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  // Calculate totals
  const taskTotal = quote.tasks.reduce((sum, task) => sum + Number(task.price), 0);
  const materialsTotal = quote.tasks.reduce(
    (sum, task) => sum + Number(task.estimatedMaterialsCost),
    0
  );
  const subtotal = taskTotal + materialsTotal;
  const complexity = complexityCharge;
  const markup = (subtotal + complexity) * (markupPercentage / 100);
  const grandTotal = subtotal + complexity + markup;

  const handleSaveCharges = () => {
    updateCharges.mutate({
      id: quote.id,
      complexityCharge: complexityCharge,
      markupCharge: markup,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Project Info */}
        <Card className="md:col-span-2">
          <CardHeader className="flex justify-between">
            <h2 className="text-xl font-bold">{quote.projectName}</h2>
            <Chip color={statusColors[quote.status as keyof typeof statusColors]} variant="flat">
              {quote.status}
            </Chip>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-small text-default-500">Customer</p>
                <p className="font-medium">{quote.customerName}</p>
              </div>
              {quote.customerEmail && (
                <div>
                  <p className="text-small text-default-500">Email</p>
                  <p className="font-medium">{quote.customerEmail}</p>
                </div>
              )}
              {quote.customerPhone && (
                <div>
                  <p className="text-small text-default-500">Phone</p>
                  <p className="font-medium">{quote.customerPhone}</p>
                </div>
              )}
              {quote.notes && (
                <div className="md:col-span-2">
                  <p className="text-small text-default-500">Notes</p>
                  <p className="font-medium">{quote.notes}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Status and Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold">Actions</h2>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div className="flex flex-col gap-2">
              <p className="text-small text-default-500">Change Status</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(statusColors).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    color={statusColors[status as keyof typeof statusColors]}
                    variant={quote.status === status ? 'solid' : 'flat'}
                    onPress={() =>
                      updateStatus.mutate({
                        id: quote.id,
                        status: status as any,
                      })
                    }
                    isLoading={updateStatus.isPending}
                  >
                    <Badge
                      color={statusColors[status as keyof typeof statusColors]}
                      variant="solid"
                    >
                      {status}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
            <Divider />
            <Button
              color="danger"
              onPress={() => {
                if (window.confirm('Are you sure you want to delete this quote?')) {
                  deleteQuote.mutate({ id: quote.id });
                }
              }}
              isLoading={deleteQuote.isPending}
            >
              Delete Quote
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-bold">Tasks</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          {quote.tasks.length === 0 ? (
            <p className="py-4 text-center">No tasks added yet</p>
          ) : (
            <div className="space-y-4">
              {quote.tasks.map((task) => (
                <Card key={task.id} className="border-1">
                  <CardBody>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="md:col-span-2">
                        <p className="font-medium">{task.description}</p>
                        <p className="text-small text-default-500">
                          Materials Estimate: {formatCurrency(Number(task.estimatedMaterialsCost))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-large font-bold">{formatCurrency(Number(task.price))}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Adjustments and Totals */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-bold">Adjustments</h2>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <NumberInput
                label="Complexity Charge"
                value={complexityCharge}
                onValueChange={setComplexityCharge}
                startContent="$"
                min={0}
                step={0.01}
                formatOptions={{
                  style: 'decimal',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
                className="max-w-xs"
                aria-label="Complexity Charge"
              />
              <NumberInput
                label="Markup Percentage"
                value={markupPercentage}
                onValueChange={setMarkupPercentage}
                endContent="%"
                min={0}
                max={100}
                step={0.1}
                formatOptions={{
                  style: 'decimal',
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }}
                className="max-w-xs"
                aria-label="Markup Percentage"
              />
              <Button
                color="primary"
                onPress={handleSaveCharges}
                isLoading={updateCharges.isPending}
              >
                Save Changes
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold">Totals</h2>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-2">
            <div className="flex justify-between">
              <span>Tasks Subtotal:</span>
              <span>{formatCurrency(taskTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Materials Subtotal:</span>
              <span>{formatCurrency(materialsTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Complexity Charge:</span>
              <span>{formatCurrency(complexity)}</span>
            </div>
            <div className="flex justify-between">
              <span>Markup ({markupPercentage.toFixed(1)}%):</span>
              <span>{formatCurrency(markup)}</span>
            </div>
            <Divider />
            <div className="flex justify-between text-lg font-bold">
              <span>Grand Total:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
