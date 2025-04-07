import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  Tab,
  Tabs,
} from '@heroui/react';
import {
  Edit,
  Eye,
  Plus,
  Search,
  Trash,
  LayoutGrid,
  LayoutList,
  Tag,
  FileText,
} from 'lucide-react';

import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { routes } from '~/config/routes';
import { DeleteEntityDialog } from '~/components/shared/DeleteEntityDialog';
import { formatDate } from '~/utils/date';
import { ListToolbar } from '~/components/shared/ListToolbar';

export function CategoriesList() {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(
    null
  );
  const [viewType, setViewType] = useState<'card' | 'table'>('card');

  // Fetch categories
  const { data, isLoading, refetch } = api.productCategory.getAll.useQuery({
    sortOrder: 'desc',
    orderBy: 'createdAt',
  });

  // Delete category mutation
  const deleteCategoryMutation = api.productCategory.delete.useMutation({
    onSuccess: () => {
      refetch();
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
  });

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Get filtered categories based on search
  const filteredCategories = data
    ? data.filter(
        (category) =>
          category.name.toLowerCase().includes(search.toLowerCase()) ||
          (category.description &&
            category.description.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  // Handle delete
  const handleDeleteClick = (id: string, name: string) => {
    setCategoryToDelete({ id, name });
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (categoryToDelete) {
      await deleteCategoryMutation.mutateAsync({ id: categoryToDelete.id });
    }
  };

  // Navigate to create new category
  const navigateToCreateCategory = () => {
    router.push(routes.admin.categories.new);
  };

  // Navigate to edit category
  const navigateToEditCategory = (id: string) => {
    router.push(routes.admin.categories.edit(id));
  };

  // Navigate to view category
  const navigateToViewCategory = (id: string) => {
    router.push(routes.admin.categories.detail(id));
  };

  // Render card for a category
  const renderCategoryCard = useCallback(
    (category: { id: string; name: string; description: string | null; createdAt: Date }) => (
      <Card key={category.id} className="overflow-hidden">
        <CardBody className="p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-primary" />
              <h3 className="text-lg font-semibold">{category.name}</h3>
            </div>

            <div className="text-default-500 mt-2">
              {category.description || t('common.noDescription')}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <FileText size={14} className="text-default-400" />
              <p className="text-sm">{formatDate(category.createdAt)}</p>
            </div>
          </div>
        </CardBody>

        <div className="border-default-100 flex gap-2 border-t p-3">
          <Button
            size="sm"
            color="primary"
            variant="flat"
            startContent={<Eye size={16} />}
            onPress={() => navigateToViewCategory(category.id)}
            className="flex-1"
          >
            {t('common.view')}
          </Button>
          <Button
            size="sm"
            color="default"
            variant="flat"
            startContent={<Edit size={16} />}
            onPress={() => navigateToEditCategory(category.id)}
            className="flex-1"
          >
            {t('common.edit')}
          </Button>
          <Button
            size="sm"
            color="danger"
            variant="flat"
            startContent={<Trash size={16} />}
            onPress={() => handleDeleteClick(category.id, category.name)}
            className="flex-1"
          >
            {t('common.delete')}
          </Button>
        </div>
      </Card>
    ),
    [t, navigateToViewCategory, navigateToEditCategory, handleDeleteClick]
  );

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ListToolbar
        viewType={viewType}
        onViewTypeChange={(type) => setViewType(type)}
        searchValue={search}
        onSearchChange={setSearch}
        onCreateClick={navigateToCreateCategory}
        createButtonLabel={t('common.create')}
        searchPlaceholder={t('categories.searchPlaceholder')}
      />

      <Card>
        <CardBody className="px-2 sm:px-4">
          {filteredCategories.length === 0 ? (
            <div className="text-default-500 py-8 text-center">{t('categories.noCategories')}</div>
          ) : viewType === 'card' ? (
            // Card View
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCategories.map(renderCategoryCard)}
            </div>
          ) : (
            // Table View
            <div className="-mx-2 overflow-x-auto sm:-mx-4">
              <Table
                aria-label="Categories table"
                classNames={{
                  wrapper: 'min-w-[600px]',
                  th: 'text-xs sm:text-sm bg-default-100/80 backdrop-blur-md',
                  td: 'text-xs sm:text-sm py-2 sm:py-4',
                }}
              >
                <TableHeader>
                  <TableColumn>{t('categories.list.name')}</TableColumn>
                  <TableColumn>{t('categories.list.description')}</TableColumn>
                  <TableColumn>{t('categories.list.productCount')}</TableColumn>
                  <TableColumn className="text-right">{t('common.actions')}</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={
                    <div className="text-default-500 py-8 text-center">
                      {t('categories.noCategories')}
                    </div>
                  }
                  items={filteredCategories}
                >
                  {(category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="font-medium">{category.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate">
                          {category.description || t('common.noDescription')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color="primary">
                          {/* We don't have product count in the basic category object */}0
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Tooltip content={t('common.view')}>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => navigateToViewCategory(category.id)}
                            >
                              <Eye size={16} />
                            </Button>
                          </Tooltip>
                          <Tooltip content={t('common.edit')}>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => navigateToEditCategory(category.id)}
                            >
                              <Edit size={16} />
                            </Button>
                          </Tooltip>
                          <Tooltip content={t('common.delete')} color="danger">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => handleDeleteClick(category.id, category.name)}
                            >
                              <Trash size={16} />
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      <DeleteEntityDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        entityName={t('categories.entityName')}
        entityLabel={categoryToDelete?.name || ''}
        isLoading={deleteCategoryMutation.isPending}
      />
    </div>
  );
}
