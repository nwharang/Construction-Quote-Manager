'use client';

import React, { useState } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import { api, type RouterOutputs } from '~/utils/api';
import { EntityList, type EntityColumn } from '~/components/shared/EntityList';

// Use inferred type from the API output for the list items
type CustomerListItem = RouterOutputs['customer']['getAll']['customers'][number];
// Original Drizzle type (might be needed for mutations)
// type Customer = InferSelectModel<typeof customers>;

export function CustomersList() {
  const { t, formatDate } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const pageSize = 10;

  // Get customers data with search and pagination
  const { data: customersData, isLoading } = api.customer.getAll.useQuery({
    page,
    limit: pageSize,
    search: search,
  });

  // Define columns for customer list
  const columns: EntityColumn<CustomerListItem>[] = [
    {
      key: 'name',
      label: t('customers.list.name'),
      sortable: true,
    },
    {
      key: 'email',
      label: t('customers.list.email'),
      render: (customer) => customer.email || '-',
    },
    {
      key: 'phone',
      label: t('customers.list.phone'),
      render: (customer) => customer.phone || '-',
    },
    {
      key: 'createdAt',
      label: t('customers.list.created'),
      render: (customer: CustomerListItem) =>
        customer.createdAt ? formatDate(customer.createdAt, 'short') : '-',
    },
  ];

  return (
    <>
      <EntityList<CustomerListItem>
        title={t('customers.list.title')}
        baseUrl="/admin/customers"
        columns={columns}
        entities={customersData?.customers ?? []}
        isLoading={isLoading}
        pagination={{
          total: customersData?.total ?? 0,
          page: page,
          pageSize: pageSize,
          onPageChange: setPage,
        }}
        enableSearch={true}
        searchPlaceholder={t('customers.list.searchPlaceholder')}
        onSearchChange={setSearch}
      />
    </>
  );
}
