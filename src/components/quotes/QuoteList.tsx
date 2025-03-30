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
import { Eye } from "lucide-react";
import { api } from "~/utils/api";
import { formatUserFriendlyId } from "~/utils/formatters";
import { formatCurrency } from "~/utils/currency";
import { formatDate } from "~/utils/formatters";

// Define the Quote type based on the structure from the API
interface Quote {
  id: string;
  sequentialId: number;
  title: string;
  customerName: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
  grandTotal: number;
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

  return (
    <Table aria-label="Quotes list">
      <TableHeader>
        <TableColumn>ID</TableColumn>
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
            <TableCell>{formatUserFriendlyId(quote.id, quote.sequentialId)}</TableCell>
            <TableCell>{quote.title}</TableCell>
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
              {formatCurrency(quote.grandTotal)}
            </TableCell>
            <TableCell>{formatDate(quote.createdAt)}</TableCell>
            <TableCell>
              <Button
                color="primary"
                variant="flat"
                size="sm"
                startContent={<Eye size={16} />}
                onPress={() => router.push(`/admin/quotes/${quote.id}`)}
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