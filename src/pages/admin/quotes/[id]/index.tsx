"use client";

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Button,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Breadcrumbs,
  BreadcrumbItem,
  Badge,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { Edit, Trash2, MoreVertical, ArrowLeft, Download, Mail, Copy } from 'lucide-react';
import { useQuotes } from '~/contexts/QuotesContext';
import { useTranslation } from '~/hooks/useTranslation';
import { QuoteStatus } from '~/server/db/schema';

export default function QuoteDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { status } = useSession();
  const { t, formatCurrency, formatDate } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Get quote context
  const {
    currentQuote: quote,
    tasks,
    loading,
    isSubmitting,
    fetchQuoteById,
    deleteQuote,
    updateQuoteStatus,
  } = useQuotes();
  
  // Fetch quote data when component mounts
  useEffect(() => {
    if (id && typeof id === 'string' && status === 'authenticated' && !loading) {
      fetchQuoteById(id);
    }
  }, [id, status]);
  
  // Set mounted state on initial render only
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Handle quote deletion
  const handleDeleteQuote = async () => {
    if (id && typeof id === 'string') {
      const success = await deleteQuote(id);
      if (success) {
        router.push('/admin/quotes');
      }
    }
  };
  
  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (id && typeof id === 'string') {
      await updateQuoteStatus(id, newStatus as any);
    }
  };
  
  // Get status color
  const getStatusColor = (status: string): "primary" | "success" | "warning" | "danger" | "default" => {
    switch (status) {
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
    switch (status) {
      case 'draft':
        return "Draft";
      case 'sent':
        return "Sent";
      case 'accepted':
        return "Accepted";
      case 'rejected':
        return "Rejected";
      case 'in_progress':
        return "In Progress";
      case 'completed':
        return "Completed";
      default:
        return status;
    }
  };
  
  // Render loading state
  if (!mounted || status === 'loading' || loading) {
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
  
  // Render not found state
  if (!quote) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Quote Not Found</h2>
          <p className="text-muted-foreground mb-6">The quote you're looking for doesn't exist or has been removed.</p>
          <Button 
            color="primary"
            onPress={() => router.push('/admin/quotes')}
            startContent={<ArrowLeft size={16} />}
          >
            Back to Quotes
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>{quote.title} | Quote Details</title>
      </Head>
      
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Breadcrumbs>
            <BreadcrumbItem href="/admin">Dashboard</BreadcrumbItem>
            <BreadcrumbItem href="/admin/quotes">Quotes</BreadcrumbItem>
            <BreadcrumbItem>{quote.title}</BreadcrumbItem>
          </Breadcrumbs>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4">
            <div>
              <h1 className="text-2xl font-bold">{quote.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge color={getStatusColor(quote.status)}>
                  {getStatusDisplay(quote.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Created {formatDate(quote.createdAt)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0">
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    color="primary"
                    aria-label="Change quote status"
                  >
                    Change Status
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Quote status options">
                  <DropdownItem 
                    key="draft"
                    onPress={() => handleStatusChange('draft')}
                    startContent={<Badge color="default">Draft</Badge>}
                  >
                    Mark as Draft
                  </DropdownItem>
                  <DropdownItem 
                    key="sent"
                    onPress={() => handleStatusChange('sent')}
                    startContent={<Badge color="primary">Sent</Badge>}
                  >
                    Mark as Sent
                  </DropdownItem>
                  <DropdownItem 
                    key="accepted"
                    onPress={() => handleStatusChange('accepted')}
                    startContent={<Badge color="success">Accepted</Badge>}
                  >
                    Mark as Accepted
                  </DropdownItem>
                  <DropdownItem 
                    key="rejected"
                    onPress={() => handleStatusChange('rejected')}
                    startContent={<Badge color="danger">Rejected</Badge>}
                  >
                    Mark as Rejected
                  </DropdownItem>
                  <DropdownItem 
                    key="in_progress"
                    onPress={() => handleStatusChange('in_progress')}
                    startContent={<Badge color="warning">In Progress</Badge>}
                  >
                    Mark as In Progress
                  </DropdownItem>
                  <DropdownItem 
                    key="completed"
                    onPress={() => handleStatusChange('completed')}
                    startContent={<Badge color="success">Completed</Badge>}
                  >
                    Mark as Completed
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
              
              <Button
                as={Link}
                href={`/admin/quotes/${id}/edit`}
                color="primary"
                variant="flat"
                startContent={<Edit size={16} />}
                aria-label="Edit quote"
              >
                Edit
              </Button>
              
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    isIconOnly 
                    variant="light" 
                    aria-label="More options"
                  >
                    <MoreVertical size={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Quote actions">
                  <DropdownItem 
                    key="download"
                    startContent={<Download size={16} />}
                  >
                    Download PDF
                  </DropdownItem>
                  <DropdownItem 
                    key="email"
                    startContent={<Mail size={16} />}
                  >
                    Email to Customer
                  </DropdownItem>
                  <DropdownItem 
                    key="duplicate"
                    startContent={<Copy size={16} />}
                  >
                    Duplicate Quote
                  </DropdownItem>
                  <DropdownItem 
                    key="delete"
                    className="text-danger"
                    color="danger"
                    startContent={<Trash2 size={16} />}
                    onPress={() => setDeleteConfirmOpen(true)}
                  >
                    Delete Quote
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Customer Information */}
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-xl font-semibold">Customer Information</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                    <p className="text-lg">{quote.customerName}</p>
                  </div>
                  
                  {quote.customerEmail && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                      <p className="text-lg">{quote.customerEmail}</p>
                    </div>
                  )}
                  
                  {quote.customerPhone && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                      <p className="text-lg">{quote.customerPhone}</p>
                    </div>
                  )}
                </div>
                
                {quote.notes && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                    <p className="mt-1 whitespace-pre-line">{quote.notes}</p>
                  </div>
                )}
              </CardBody>
            </Card>
            
            {/* Tasks */}
            <Card className="mb-6">
              <CardHeader className="flex justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">Tasks</h2>
                  <Badge variant="flat" size="sm">
                    {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                {tasks.length > 0 ? (
                  <Table aria-label="Quote tasks">
                    <TableHeader>
                      <TableColumn>Task</TableColumn>
                      <TableColumn>Price</TableColumn>
                      <TableColumn>Quantity</TableColumn>
                      <TableColumn>Materials Cost</TableColumn>
                      <TableColumn>Total</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task, index) => {
                        const taskTotal = Number(task.price) * task.quantity;
                        let materialCost = 0;
                        
                        if (task.materialType === 'lumpsum') {
                          materialCost = task.estimatedMaterialsCostLumpSum;
                        } else {
                          materialCost = task.materials.reduce(
                            (sum, material) => sum + material.unitPrice * material.quantity, 
                            0
                          );
                        }
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>{task.name}</TableCell>
                            <TableCell>{formatCurrency(task.price)}</TableCell>
                            <TableCell>{task.quantity}</TableCell>
                            <TableCell>{formatCurrency(materialCost)}</TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(taskTotal + materialCost)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks added to this quote.
                  </div>
                )}
              </CardBody>
            </Card>
            
            {/* Materials Detail (Expandable Sections) */}
            {tasks.filter(task => task.materialType === 'itemized' && task.materials.length > 0).length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <h2 className="text-xl font-semibold">Materials Detail</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {tasks.map((task, taskIndex) => {
                      if (task.materialType === 'itemized' && task.materials.length > 0) {
                        return (
                          <div key={taskIndex} className="border rounded-lg overflow-hidden">
                            <div className="bg-default-100 p-3">
                              <h3 className="font-medium">{task.name}</h3>
                            </div>
                            <Table aria-label={`Materials for ${task.name}`}>
                              <TableHeader>
                                <TableColumn>Material</TableColumn>
                                <TableColumn>Unit Price</TableColumn>
                                <TableColumn>Quantity</TableColumn>
                                <TableColumn>Total</TableColumn>
                              </TableHeader>
                              <TableBody>
                                {task.materials.map((material, materialIndex) => (
                                  <TableRow key={materialIndex}>
                                    <TableCell>{material.name || 'Unnamed Material'}</TableCell>
                                    <TableCell>{formatCurrency(material.unitPrice)}</TableCell>
                                    <TableCell>{material.quantity}</TableCell>
                                    <TableCell>
                                      {formatCurrency(material.unitPrice * material.quantity)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
          
          {/* Quote Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Quote Summary</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground">Tasks Subtotal:</p>
                      <p className="font-medium">{formatCurrency(quote.subtotalTasks)}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground">Materials Subtotal:</p>
                      <p className="font-medium">{formatCurrency(quote.subtotalMaterials)}</p>
                    </div>
                    
                    <Divider />
                    
                    {Number(quote.complexityCharge) > 0 && (
                      <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Complexity Charge:</p>
                        <p className="font-medium">{formatCurrency(quote.complexityCharge)}</p>
                      </div>
                    )}
                    
                    {Number(quote.markupCharge) > 0 && (
                      <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Markup/Profit:</p>
                        <p className="font-medium">{formatCurrency(quote.markupCharge)}</p>
                      </div>
                    )}
                    
                    <Divider />
                    
                    <div className="flex justify-between items-center font-bold">
                      <p className="text-lg">Grand Total:</p>
                      <p className="text-xl">{formatCurrency(quote.grandTotal)}</p>
                    </div>
                  </div>
                </CardBody>
                <CardFooter>
                  <div className="w-full pt-2">
                    <Button
                      color="primary"
                      className="w-full"
                      startContent={<Download size={16} />}
                    >
                      Download Quote PDF
                    </Button>
                  </div>
                </CardFooter>
              </Card>
              
              {/* Quote Timeline */}
              <Card className="mt-6">
                <CardHeader>
                  <h2 className="text-xl font-semibold">Quote Timeline</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-success mt-2"></div>
                      <div>
                        <p className="font-medium">Created</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(quote.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    {quote.updatedAt && quote.updatedAt !== quote.createdAt && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                        <div>
                          <p className="font-medium">Last Updated</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(quote.updatedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {quote.status.toLowerCase() !== 'draft' && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                        <div>
                          <p className="font-medium">Status Changed</p>
                          <p className="text-sm text-muted-foreground">
                            Changed to {getStatusDisplay(quote.status)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Delete Confirmation Dialog */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <h3 className="text-xl font-bold">Delete Quote</h3>
              </CardHeader>
              <CardBody>
                <p>
                  Are you sure you want to delete this quote? This action cannot be undone.
                </p>
              </CardBody>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="flat"
                  color="default"
                  onPress={() => setDeleteConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleDeleteQuote}
                  isLoading={isSubmitting}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
