import React from 'react';
import { Card, CardHeader, CardBody, Chip, Button } from '@heroui/react';
import { FileText, Plus } from 'lucide-react';
import { QuoteStatus } from '~/server/db/schema';
import { useTranslation } from '~/hooks/useTranslation';
import { useRouter } from 'next/router';

interface Quote {
  id: string;
  title: string;
  customerName: string;
  status: keyof typeof QuoteStatus;
  grandTotal: string;
}

interface RecentActivityProps {
  quotes: Quote[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ quotes }) => {
  const router = useRouter();
  const { formatCurrency } = useTranslation();

  const goToNewQuote = () => {
    router.push('/admin/quotes/new');
  };

  return (
    <Card className="bg-card/50 border-border/50 border backdrop-blur-sm">
      <CardHeader className="px-6 py-4">
        <h3 className="text-foreground/90 text-lg font-medium">Recent Activity</h3>
      </CardHeader>
      <CardBody className="p-6">
        {quotes && quotes.length > 0 ? (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="hover:bg-muted/10 flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-colors"
                onClick={() => router.push(`/admin/quotes/${quote.id}`)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <FileText className="text-muted-foreground/60 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-foreground/90 text-sm font-medium">{quote.title}</p>
                    <p className="text-muted-foreground/80 text-sm">{quote.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-muted-foreground/80 text-sm">
                    {formatCurrency(Number(quote.grandTotal))}
                  </span>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={
                      quote.status === QuoteStatus.ACCEPTED
                        ? 'success'
                        : quote.status === QuoteStatus.REJECTED
                          ? 'danger'
                          : quote.status === QuoteStatus.SENT
                            ? 'primary'
                            : 'default'
                    }
                  >
                    {quote.status.toLowerCase()}
                  </Chip>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <FileText className="text-muted-foreground/40 mx-auto h-12 w-12" />
            <h3 className="text-foreground/90 mt-2 text-sm font-medium">No activity yet</h3>
            <p className="text-muted-foreground/80 mt-1 text-sm">
              Get started by creating your first quote.
            </p>
            <div className="mt-6">
              <Button
                color="primary"
                startContent={<Plus className="h-5 w-5" />}
                onPress={goToNewQuote}
              >
                New Quote
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
