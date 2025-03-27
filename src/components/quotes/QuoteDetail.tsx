"use client";

import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Button,
  Chip,
  Input,
} from "@nextui-org/react";
import { type RouterOutputs } from "~/utils/api";
import { useState } from "react";
import { api } from "~/utils/api";
import { useRouter } from "next/navigation";

type Quote = RouterOutputs["quotes"]["getById"];

interface QuoteDetailProps {
  quote: Quote;
}

export function QuoteDetail({ quote }: QuoteDetailProps) {
  const router = useRouter();
  const [complexityCharge, setComplexityCharge] = useState(quote.complexityCharge);
  const [markupCharge, setMarkupCharge] = useState(quote.markupCharge);

  const updateStatus = api.quotes.updateStatus.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });

  const updateCharges = api.quotes.updateCharges.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleStatusChange = (status: Quote["status"]) => {
    updateStatus.mutate({
      quoteId: quote.id,
      status,
    });
  };

  const handleChargesUpdate = () => {
    updateCharges.mutate({
      quoteId: quote.id,
      complexityCharge,
      markupCharge,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex justify-between">
          <div>
            <h2 className="text-xl font-bold">{quote.projectName}</h2>
            <p className="text-sm text-default-500">
              Created on {new Date(quote.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Chip
              color={
                quote.status === "DRAFT"
                  ? "default"
                  : quote.status === "SENT"
                  ? "primary"
                  : quote.status === "ACCEPTED"
                  ? "success"
                  : "danger"
              }
            >
              {quote.status}
            </Chip>
            {quote.status === "DRAFT" && (
              <Button
                color="primary"
                onClick={() => handleStatusChange("SENT")}
              >
                Send Quote
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold">Customer Information</h3>
              <p>{quote.customerName}</p>
              {quote.customerEmail && <p>{quote.customerEmail}</p>}
              {quote.customerPhone && <p>{quote.customerPhone}</p>}
            </div>
            {quote.notes && (
              <div>
                <h3 className="font-semibold">Notes</h3>
                <p>{quote.notes}</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Tasks</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {quote.tasks.map((task) => (
              <div key={task.id} className="rounded-lg border p-4">
                <div className="flex justify-between">
                  <h3 className="font-semibold">{task.description}</h3>
                  <p className="font-semibold">${task.taskPrice.toFixed(2)}</p>
                </div>
                {task.estimatedMaterialsCostLumpSum && (
                  <p className="text-sm text-default-500">
                    Materials: ${task.estimatedMaterialsCostLumpSum.toFixed(2)}
                  </p>
                )}
                {task.materials.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-semibold">Materials:</h4>
                    <ul className="list-inside list-disc text-sm">
                      {task.materials.map((material) => (
                        <li key={material.id}>
                          {material.product?.name ?? "Custom"} -{" "}
                          {material.quantity} x ${material.unitPrice.toFixed(2)} ={" "}
                          ${material.totalPrice.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Adjustments</h2>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Input
                label="Complexity Charge (%)"
                type="number"
                value={complexityCharge.toString()}
                onChange={(e) =>
                  setComplexityCharge(Number(e.target.value))
                }
              />
            </div>
            <div>
              <Input
                label="Markup Charge (%)"
                type="number"
                value={markupCharge.toString()}
                onChange={(e) => setMarkupCharge(Number(e.target.value))}
              />
            </div>
            <div className="md:col-span-2">
              <Button
                color="primary"
                onClick={handleChargesUpdate}
                className="w-full"
              >
                Update Charges
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Totals</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal (Tasks)</span>
              <span>${quote.subtotalTasks.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal (Materials)</span>
              <span>${quote.subtotalMaterials.toFixed(2)}</span>
            </div>
            <Divider />
            <div className="flex justify-between">
              <span>Complexity Charge</span>
              <span>${quote.complexityCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Markup Charge</span>
              <span>${quote.markupCharge.toFixed(2)}</span>
            </div>
            <Divider />
            <div className="flex justify-between font-bold">
              <span>Grand Total</span>
              <span>${quote.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 