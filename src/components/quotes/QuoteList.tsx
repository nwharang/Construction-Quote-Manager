"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Chip,
} from "@nextui-org/react";
import { type RouterOutputs } from "~/utils/api";
import Link from "next/link";

type Quote = RouterOutputs["quotes"]["list"][number];

const statusColors = {
  DRAFT: "default",
  SENT: "primary",
  ACCEPTED: "success",
  REJECTED: "danger",
} as const;

export function QuoteList({ quotes }: { quotes: Quote[] }) {
  return (
    <Table aria-label="Quotes table">
      <TableHeader>
        <TableColumn>Project</TableColumn>
        <TableColumn>Customer</TableColumn>
        <TableColumn>Status</TableColumn>
        <TableColumn>Total</TableColumn>
        <TableColumn>Created</TableColumn>
        <TableColumn>Actions</TableColumn>
      </TableHeader>
      <TableBody>
        {quotes.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell>{quote.projectName}</TableCell>
            <TableCell>{quote.customerName}</TableCell>
            <TableCell>
              <Chip color={statusColors[quote.status]}>
                {quote.status}
              </Chip>
            </TableCell>
            <TableCell>${quote.grandTotal.toFixed(2)}</TableCell>
            <TableCell>
              {new Date(quote.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  as={Link}
                  href={`/quotes/${quote.id}`}
                  size="sm"
                  variant="flat"
                >
                  View
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 