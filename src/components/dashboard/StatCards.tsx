import React from 'react';
import { Card, CardBody } from '@heroui/react';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  DollarSignIcon, 
  UsersIcon, 
  BarChart3Icon, 
  PercentIcon 
} from 'lucide-react';

export interface StatCardsProps {
  // Add props here
  totalRevenue?: number;
  totalQuotes?: number;
  totalCustomers?: number;
  conversionRate?: number;
  isLoading?: boolean;
}

export const StatCards: React.FC<StatCardsProps> = ({
  totalRevenue = 0,
  totalQuotes = 0,
  totalCustomers = 0,
  conversionRate = 0,
  isLoading = false,
}) => {
  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Helper function to format numbers
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  // Helper function to format percentages
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Stat data
  const statItems = [
    {
      title: 'Total Revenue',
      value: totalRevenue,
      formatter: formatCurrency,
      icon: <DollarSignIcon className="h-6 w-6 text-green-500" />,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Total Quotes',
      value: totalQuotes,
      formatter: formatNumber,
      icon: <BarChart3Icon className="h-6 w-6 text-blue-500" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Total Customers',
      value: totalCustomers,
      formatter: formatNumber,
      icon: <UsersIcon className="h-6 w-6 text-purple-500" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: 'Conversion Rate',
      value: conversionRate,
      formatter: formatPercent,
      icon: <PercentIcon className="h-6 w-6 text-amber-500" />,
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
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