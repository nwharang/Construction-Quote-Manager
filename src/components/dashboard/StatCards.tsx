import React from 'react';
import { Card, CardBody } from '@heroui/react';
import { FileText, User, BarChart4, Check } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';

interface StatCardsProps {
  totalQuotes: number;
  acceptedQuotes: number;
  totalCustomers: number;
  totalRevenue: string;
}

interface StatItem {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  bgColor: string;
  formatter: (value: number | string) => string;
}

export const StatCards: React.FC<StatCardsProps> = ({
  totalQuotes,
  acceptedQuotes,
  totalCustomers,
  totalRevenue,
}) => {
  const { formatCurrency } = useTranslation();

  const statItems: StatItem[] = [
    {
      title: 'Total Quotes',
      value: totalQuotes,
      icon: <FileText className="h-6 w-6 text-primary/80" />,
      bgColor: 'bg-primary/5',
      formatter: (value: number | string) => value.toString(),
    },
    {
      title: 'Accepted Quotes',
      value: acceptedQuotes,
      icon: <Check className="h-6 w-6 text-success/80" />,
      bgColor: 'bg-success/5',
      formatter: (value: number | string) => value.toString(),
    },
    {
      title: 'Total Customers',
      value: totalCustomers,
      icon: <User className="h-6 w-6 text-warning/80" />,
      bgColor: 'bg-warning/5',
      formatter: (value: number | string) => value.toString(),
    },
    {
      title: 'Total Revenue',
      value: totalRevenue,
      icon: <BarChart4 className="h-6 w-6 text-info/80" />,
      bgColor: 'bg-info/5',
      formatter: (value: number | string) => {
        if (typeof value === 'string') {
          return formatCurrency(parseFloat(value) || 0);
        }
        return formatCurrency(value);
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <Card 
          key={index}
          className="bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-md transition-all duration-200"
        >
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-lg ${item.bgColor}`}>
                {item.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground/80">{item.title}</p>
                <div className="text-2xl font-bold text-foreground/90">
                  {item.formatter(item.value)}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}; 