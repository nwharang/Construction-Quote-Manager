"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Chip,
} from "@heroui/react";
import { api } from "~/utils/api";

// Define the Quote type based on the structure from the API
interface Quote {
  id: string;
  projectName: string;
  customerName: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
  complexityCharge: string | number;
  markupPercentage: string | number;
  createdAt: Date;
  updatedAt: Date;
  customerEmail?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
}

// Status color mapping
const statusColors = {
  DRAFT: "default",
  SENT: "primary",
  ACCEPTED: "success",
  REJECTED: "danger",
} as const;

export default function QuoteList({ quotes }: { quotes: Quote[] }) {
  const router = useRouter();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  return (
    <Table aria-label="Quotes list">
      <TableHeader>
        <TableColumn>PROJECT</TableColumn>
        <TableColumn>CUSTOMER</TableColumn>
        <TableColumn>STATUS</TableColumn>
        <TableColumn>TOTAL</TableColumn>
        <TableColumn>CREATED</TableColumn>
        <TableColumn>ACTIONS</TableColumn>
      </TableHeader>
      <TableBody>
        {quotes.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell>{quote.projectName}</TableCell>
            <TableCell>{quote.customerName}</TableCell>
            <TableCell>
              <Chip
                color={statusColors[quote.status as keyof typeof statusColors]}
                variant="flat"
              >
                {quote.status}
              </Chip>
            </TableCell>
            <TableCell>
              {formatCurrency(Number(quote.complexityCharge))}
            </TableCell>
            <TableCell>{formatDate(quote.createdAt)}</TableCell>
            <TableCell>
              <Button
                color="primary"
                
                onPress={() => router.push(`/quotes/${quote.id}`)}
              >
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 