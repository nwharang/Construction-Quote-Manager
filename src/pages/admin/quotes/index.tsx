"use client";

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Select,
  SelectItem,
} from '@heroui/react';
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, Download } from 'lucide-react';
import { api } from '~/utils/api';
import { useQuotes } from '~/contexts/QuotesContext';
import { useTranslation } from '~/hooks/useTranslation';

// Type for quote list item
type QuoteListItem = {
  id: string;
  title: string;
  customerName: string;
  status: string;
  grandTotal: number;
  createdAt: Date;
};

export default function QuotesPage() {
  const router = useRouter();
  const { status } = useSession();
  const { t, formatCurrency, formatDate } = useTranslation();
  const [mounted, setMounted] = useState(false);
  
  // Local state for filtering and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Get all quotes
  const { data: quotesData, isLoading } = api.quote.getAll.useQuery(
    { 
      limit: pageSize,
      page: currentPage,
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter as any : undefined,
    },
    { 
      enabled: status === 'authenticated' && mounted,
      refetchOnWindowFocus: true,
    }
  );

  // Get quote context for deletions
  const { deleteQuote, isSubmitting } = useQuotes();
  
  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };
  
  // Handle sorting
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Handle delete confirmation
  const handleDeleteQuote = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      const success = await deleteQuote(id);
      if (success) {
        // Refetch quotes
        void refetch();
      }
    }
  };

  // Refetch quotes data
  const { refetch } = api.quote.getAll.useQuery(
    { 
      limit: pageSize,
      page: currentPage,
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter as any : undefined,
    },
    { 
      enabled: false,
    }
  );
  
  // Get status color
  const getStatusColor = (status: string): "primary" | "success" | "warning" | "danger" | "default" => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'draft':
        return "default";
      case 'sent':
        return "primary";
      case 'accepted':
        return "success";
      case 'rejected':
        return "danger";
      case 'in_progress':
        return "warning";
      case 'completed':
        return "success";
      default:
        return "default";
    }
  };
  
  // Get status display name
  const getStatusDisplay = (status: string): string => {
    // Convert snake_case to Title Case
    return status
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Calculate total pages
  const totalPages = quotesData ? Math.ceil(quotesData.total / pageSize) : 0;
  
  // Render loading state
  if (!mounted || status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  
  return (
    <>
      <Head>
        <title>Quotes | Construction Quote Manager</title>
      </Head>
      
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Quotes</h1>
              <p className="text-muted-foreground">
                Manage your construction quotes and estimates
              </p>
            </div>
            
            <Button
              as={Link}
              href="/admin/quotes/new"
              color="primary"
              startContent={<Plus size={16} />}
              aria-label="Create new quote"
            >
              New Quote
            </Button>
          </div>
          
          <div className="mt-6 flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Search quotes..."
              startContent={<Search size={16} />}
              value={searchQuery}
              onChange={handleSearch}
              className="max-w-md"
              aria-label="Search quotes"
            />
            
            <Select
              placeholder="Filter by status"
              selectedKeys={[statusFilter]}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              aria-label="Filter by status"
              startContent={<Filter size={16} />}
              className="max-w-xs"
            >
              <SelectItem key="all">All Statuses</SelectItem>
              <SelectItem key="draft">Draft</SelectItem>
              <SelectItem key="sent">Sent</SelectItem>
              <SelectItem key="accepted">Accepted</SelectItem>
              <SelectItem key="rejected">Rejected</SelectItem>
              <SelectItem key="in_progress">In Progress</SelectItem>
              <SelectItem key="completed">Completed</SelectItem>
            </Select>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Quote List</h2>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : quotesData && quotesData.quotes.length > 0 ? (
              <>
                <Table aria-label="Quotes table">
                  <TableHeader>
                    <TableColumn 
                      className="cursor-pointer"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-1">
                        Title
                        {sortField === 'title' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableColumn>
                    <TableColumn 
                      className="cursor-pointer"
                      onClick={() => handleSort('customerName')}
                    >
                      <div className="flex items-center gap-1">
                        Customer
                        {sortField === 'customerName' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableColumn>
                    <TableColumn 
                      className="cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortField === 'status' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableColumn>
                    <TableColumn 
                      className="cursor-pointer"
                      onClick={() => handleSort('grandTotal')}
                    >
                      <div className="flex items-center gap-1">
                        Total
                        {sortField === 'grandTotal' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableColumn>
                    <TableColumn 
                      className="cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1">
                        Created
                        {sortField === 'createdAt' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableColumn>
                    <TableColumn>Actions</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {quotesData.quotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell>
                          <Link 
                            href={`/admin/quotes/${quote.id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {quote.title}
                          </Link>
                        </TableCell>
                        <TableCell>{quote.customerName}</TableCell>
                        <TableCell>
                          <Badge color={getStatusColor(quote.status)}>
                            {getStatusDisplay(quote.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(Number(quote.grandTotal))}</TableCell>
                        <TableCell>{formatDate(quote.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              as={Link}
                              href={`/admin/quotes/${quote.id}`}
                              isIconOnly
                              variant="light"
                              aria-label={`View quote ${quote.title}`}
                            >
                              <Eye size={16} />
                            </Button>
                            
                            <Button
                              as={Link}
                              href={`/admin/quotes/${quote.id}/edit`}
                              isIconOnly
                              variant="light"
                              color="primary"
                              aria-label={`Edit quote ${quote.title}`}
                            >
                              <Edit size={16} />
                            </Button>
                            
                            <Button
                              isIconOnly
                              variant="light"
                              color="danger"
                              aria-label={`Delete quote ${quote.title}`}
                              onPress={() => handleDeleteQuote(quote.id)}
                              isDisabled={isSubmitting}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1}-
                    {Math.min(currentPage * pageSize, quotesData.total)} of {quotesData.total} quotes
                  </p>
                  
                  <Pagination
                    total={totalPages}
                    page={currentPage}
                    onChange={setCurrentPage}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-6">No quotes found</p>
                <Button
                  as={Link}
                  href="/admin/quotes/new"
                  color="primary"
                  startContent={<Plus size={16} />}
                >
                  Create Your First Quote
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
