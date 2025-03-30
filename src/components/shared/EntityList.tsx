import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Button, 
  Spinner,
  Pagination,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Skeleton
} from '@heroui/react';
import { Plus, Search, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { useRouter } from 'next/router';
import { useUIStore, useEntityStore, createEntityStore } from '~/store';

export interface EntityColumn<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface EntityListProps<T> {
  title: string;
  entities: T[];
  columns: EntityColumn<T>[];
  baseUrl: string;
  isLoading?: boolean;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  actions?: {
    view?: boolean;
    edit?: boolean;
    delete?: boolean;
    custom?: Array<{
      label: string;
      icon?: React.ReactNode;
      handler: (item: T) => void;
    }>;
  };
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  idField?: string;
  emptyStateMessage?: string;
  emptyStateAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

/**
 * A reusable component for entity lists with consistent styling
 * Can be used for quotes, customers, products, etc.
 */
export function EntityList<T extends { id: string }>({
  title,
  entities,
  columns,
  baseUrl,
  isLoading = false,
  enableSearch = true,
  searchPlaceholder = "Search...",
  onSearchChange,
  pagination,
  actions = { view: true, edit: true, delete: true },
  onView,
  onEdit,
  onDelete,
  idField = 'id',
  emptyStateMessage = "No items found",
  emptyStateAction,
}: EntityListProps<T>) {
  const router = useRouter();
  // Get UI settings from Zustand store
  const { buttonSettings, tableSettings } = useUIStore();
  
  // Get entity settings from Zustand store if available
  const entityStore = useEntityStore();
  const { settings: entitySettings } = entityStore;
  
  // Use entity settings values if available, otherwise fallback to props
  const finalBaseUrl = (entitySettings?.entityType && router.pathname.includes(entitySettings.entityType)) 
    ? entitySettings?.baseUrl || baseUrl 
    : baseUrl;
    
  const finalActions = {
    view: entitySettings?.canView !== undefined ? entitySettings?.canView : actions.view,
    edit: entitySettings?.canEdit !== undefined ? entitySettings?.canEdit : actions.edit,
    delete: entitySettings?.canDelete !== undefined ? entitySettings?.canDelete : actions.delete,
    custom: actions.custom
  };
  
  const handleView = (item: T) => {
    if (onView) {
      onView(item);
    } else {
      router.push(`${finalBaseUrl}/${item[idField as keyof T]}`);
    }
  };
  
  const handleEdit = (item: T) => {
    if (onEdit) {
      onEdit(item);
    } else {
      router.push(`${finalBaseUrl}/${item[idField as keyof T]}/edit`);
    }
  };
  
  const handleDelete = (item: T) => {
    if (onDelete) {
      onDelete(item);
    } else {
      entityStore.showSuccessToast(`Deleted successfully`);
    }
  };
  
  const handleCreate = () => {
    router.push(`${finalBaseUrl}/new`);
  };

  // Prepare table columns structure for HeroUI Table
  const tableColumns = [
    ...columns.map(col => ({
      name: col.label,
      uid: col.key
    }))
  ];
  
  if (finalActions.view || finalActions.edit || finalActions.delete || finalActions.custom) {
    tableColumns.push({ name: 'Actions', uid: 'actions' });
  }
  
  // Function to render cells based on column key
  const renderCell = (item: T, columnKey: string) => {
    if (columnKey === 'actions') {
      return (
        <div className="flex justify-end gap-2">
          {finalActions.view && (
            <Button 
              isIconOnly 
              variant="light" 
              size={buttonSettings.size}
              onPress={() => handleView(item)}
              aria-label="View details"
            >
              <Eye size={buttonSettings.size === 'sm' ? 14 : buttonSettings.size === 'lg' ? 18 : 16} />
            </Button>
          )}
          {finalActions.edit && (
            <Button 
              isIconOnly 
              color={buttonSettings.primaryColor}
              variant="light" 
              size={buttonSettings.size}
              onPress={() => handleEdit(item)}
              aria-label="Edit"
            >
              <Edit size={buttonSettings.size === 'sm' ? 14 : buttonSettings.size === 'lg' ? 18 : 16} />
            </Button>
          )}
          {finalActions.delete && (
            <Button 
              isIconOnly 
              color="danger" 
              variant="light" 
              size={buttonSettings.size}
              onPress={() => handleDelete(item)}
              aria-label="Delete"
            >
              <Trash2 size={buttonSettings.size === 'sm' ? 14 : buttonSettings.size === 'lg' ? 18 : 16} />
            </Button>
          )}
          {finalActions.custom && finalActions.custom.length > 0 && (
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  isIconOnly 
                  variant="light" 
                  size={buttonSettings.size}
                  aria-label="More actions"
                >
                  <MoreVertical size={buttonSettings.size === 'sm' ? 14 : buttonSettings.size === 'lg' ? 18 : 16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Custom actions">
                {finalActions.custom.map((action, idx) => (
                  <DropdownItem 
                    key={idx}
                    startContent={action.icon}
                    onPress={() => action.handler(item)}
                  >
                    {action.label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      );
    }
    
    // Find the column definition
    const column = columns.find(col => col.key === columnKey);
    
    if (column?.render) {
      return column.render(item);
    }
    
    // Default rendering
    return item[columnKey as keyof T] as React.ReactNode;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col p-4 gap-4">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </CardBody>
      </Card>
    );
  }
  
  // Empty state
  if (entities.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <Button 
            color={buttonSettings.primaryColor}
            size={buttonSettings.size}
            startContent={<Plus size={buttonSettings.size === 'sm' ? 14 : buttonSettings.size === 'lg' ? 18 : 16} />}
            onPress={handleCreate}
          >
            Create New
          </Button>
        </CardHeader>
        <CardBody className="flex flex-col justify-center items-center py-12 px-4 text-center">
          <p className="text-lg font-medium text-muted-foreground mb-4">{emptyStateMessage}</p>
          
          {emptyStateAction && (
            <Button
              color={buttonSettings.primaryColor}
              size={buttonSettings.size}
              startContent={emptyStateAction.icon || <Plus size={buttonSettings.size === 'sm' ? 14 : buttonSettings.size === 'lg' ? 18 : 16} />}
              onPress={emptyStateAction.onClick}
            >
              {emptyStateAction.label}
            </Button>
          )}
        </CardBody>
      </Card>
    );
  }

  // Render content for non-empty state
  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center px-6 py-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        
        <div className="flex gap-4">
          {enableSearch && onSearchChange && (
            <Input
              className="max-w-xs"
              placeholder={searchPlaceholder}
              startContent={<Search size={16} />}
              onChange={(e) => onSearchChange(e.target.value)}
              size={buttonSettings.size === 'sm' ? 'sm' : buttonSettings.size === 'lg' ? 'lg' : 'md'}
            />
          )}
          
          <Button 
            color={buttonSettings.primaryColor}
            size={buttonSettings.size}
            startContent={<Plus size={buttonSettings.size === 'sm' ? 14 : buttonSettings.size === 'lg' ? 18 : 16} />}
            onPress={handleCreate}
          >
            Create New
          </Button>
        </div>
      </CardHeader>
      
      <CardBody>
        <Table
          aria-label={`${title} table`}
          isStriped={tableSettings.stripedRows}
          isHeaderSticky
          removeWrapper
          classNames={{
            wrapper: "max-h-[calc(100vh-350px)]",
          }}
          selectionMode="none"
        >
          <TableHeader>
            {tableColumns.map((column) => (
              <TableColumn key={column.uid}>
                {column.name}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent={"No data to display"}>
            {entities.map((item) => (
              <TableRow 
                key={item.id} 
                className={tableSettings.compact ? 'h-8' : ''}
              >
                {tableColumns.map((column) => (
                  <TableCell key={column.uid}>
                    {renderCell(item, column.uid)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {pagination && (
          <div className="flex justify-center mt-4">
            <Pagination
              page={pagination.page}
              total={Math.ceil(pagination.total / pagination.pageSize)}
              onChange={pagination.onPageChange}
              size={buttonSettings.size === 'sm' ? 'sm' : buttonSettings.size === 'lg' ? 'lg' : 'md'}
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// Factory function to create specialized EntityList instances for different entity types
export function createEntityList<T extends { id: string }>(entityType: string, baseUrl: string, displayNameField: string = 'name') {
  // Initialize entity store with settings for this entity type
  createEntityStore(entityType as any, baseUrl, displayNameField);
  
  // Return a component that will use these settings
  return function SpecializedEntityList(props: Omit<EntityListProps<T>, 'baseUrl'>) {
    return (
      <EntityList<T>
        {...props}
        baseUrl={baseUrl}
      />
    );
  };
} 