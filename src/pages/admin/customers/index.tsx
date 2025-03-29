import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Plus, Search, MoreVertical, User } from 'lucide-react';
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Spinner,
} from '@heroui/react';
import { api } from '~/utils/api';
import { useAppToast } from '~/components/providers/ToastProvider';
import type { RouterOutputs } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';

type Customer = RouterOutputs['customer']['getAll']['customers'][number];

interface Column {
  name: string;
  uid: string;
}

const columns: Column[] = [
  { name: 'NAME', uid: 'name' },
  { name: 'EMAIL', uid: 'email' },
  { name: 'PHONE', uid: 'phone' },
  { name: 'ADDRESS', uid: 'address' },
  { name: 'QUOTES', uid: 'quotes' },
  { name: 'ACTIONS', uid: 'actions' },
];

export default function CustomersPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [filterValue, setFilterValue] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const toast = useAppToast();
  const { formatPhone } = useTranslation();

  // Fetch customers with pagination
  const customersQuery = api.customer.getAll.useQuery(
    {
      page,
      limit: rowsPerPage,
      search: filterValue,
    },
    { enabled: authStatus === 'authenticated' }
  );

  // Delete customer mutation
  const deleteCustomerMutation = api.customer.delete.useMutation({
    onSuccess: () => {
      toast.success('Customer deleted successfully');
      // Refetch the customers after deletion
      void customersQuery.refetch();
    },
    onError: (err) => {
      toast.error(`Error deleting customer: ${err.message}`);
    },
  });

  const handleDeleteCustomer = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteCustomerMutation.mutate({ id });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(1);
  };

  // Not authenticated
  if (authStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const renderCell = (customer: Customer, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize text-foreground">{customer.name}</p>
              <p className="text-bold text-tiny capitalize text-muted-foreground">#{customer.id}</p>
            </div>
          </div>
        );
      case 'email':
        return customer.email || '-';
      case 'phone':
        return customer.phone ? formatPhone(customer.phone) : '-';
      case 'address':
        return customer.address || '-';
      case 'quotes':
        return customer._count?.quotes || 0;
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="flat"
              color="primary"
              onPress={() => router.push(`/admin/customers/${customer.id}`)}
            >
              View
            </Button>
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <MoreVertical className="text-default-500" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Customer actions">
                <DropdownItem
                  key="edit"
                  onPress={() => router.push(`/admin/customers/${customer.id}/edit`)}
                >
                  Edit
                </DropdownItem>
                <DropdownItem
                  key="quotes"
                  onPress={() => router.push(`/admin/customers/${customer.id}/quotes`)}
                >
                  View Quotes
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  onPress={() => handleDeleteCustomer(customer.id)}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Customers | Construction Quote Manager</title>
      </Head>

      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Customers</h1>
              <p className="text-muted-foreground">Manage your customers</p>
            </div>
            <Button
              color="primary"
              startContent={<Plus size={20} />}
              onPress={() => router.push('/admin/customers/new')}
            >
              New Customer
            </Button>
          </div>

          <div className="flex justify-between items-center gap-3">
            <Input
              isClearable
              className="w-full sm:max-w-[44%]"
              placeholder="Search by name or email..."
              startContent={<Search size={18} />}
              value={filterValue}
              onValueChange={(value) => {
                setFilterValue(value);
                setPage(1);
              }}
            />
          </div>

          {customersQuery.isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
            </div>
          ) : (
            <>
              <Table
                aria-label="Customers table"
                isHeaderSticky
                classNames={{
                  wrapper: 'max-h-[600px]',
                  th: 'bg-background/50 backdrop-blur-lg text-foreground',
                  td: 'text-foreground',
                }}
              >
                <TableHeader columns={columns}>
                  {(column) => (
                    <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                      {column.name}
                    </TableColumn>
                  )}
                </TableHeader>
                <TableBody
                  items={customersQuery.data?.customers ?? []}
                  emptyContent="No customers found"
                  isLoading={customersQuery.isLoading}
                  loadingContent={<Spinner />}
                >
                  {(customer) => (
                    <TableRow key={customer.id}>
                      {(columnKey) => <TableCell>{renderCell(customer, String(columnKey))}</TableCell>}
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <select
                      className="text-sm border rounded-md px-2 py-1 bg-background text-foreground"
                      value={rowsPerPage}
                      onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                    >
                      {[10, 20, 30, 40, 50].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {customersQuery.data?.total ?? 0} items
                    </span>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Pagination
                    total={Math.ceil((customersQuery.data?.total ?? 0) / rowsPerPage)}
                    page={page}
                    onChange={handlePageChange}
                    showControls
                    color="primary"
                    classNames={{
                      wrapper: 'gap-2',
                      item: 'w-8 h-8',
                      cursor: 'bg-primary',
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
} 