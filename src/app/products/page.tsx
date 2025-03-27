"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Chip,
  Card,
  CardHeader,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Pagination
} from "@nextui-org/react";
import { Plus, Search, Edit, Trash2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "~/utils/api";
import { toast } from "sonner";

// Form validation schema
const productSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  price: z.coerce.number().positive({ message: "Price must be a positive number" }),
  unit: z.string().min(1, { message: "Unit is required" }),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<{ id: string } & ProductFormValues | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const utils = api.useUtils();
  const rowsPerPage = 10;

  // Data fetching with tRPC
  const {
    data: productsData,
    isLoading,
    error
  } = api.product.getAll.useQuery();

  const { mutate: createProduct, isLoading: isCreating } = api.product.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully");
      utils.product.getAll.invalidate();
      onClose();
      reset();
    },
    onError: (error) => {
      toast.error(`Error creating product: ${error.message}`);
    },
  });

  const { mutate: updateProduct, isLoading: isUpdating } = api.product.update.useMutation({
    onSuccess: () => {
      toast.success("Product updated successfully");
      utils.product.getAll.invalidate();
      onClose();
      reset();
    },
    onError: (error) => {
      toast.error(`Error updating product: ${error.message}`);
    },
  });

  const { mutate: deleteProduct, isLoading: isDeleting } = api.product.delete.useMutation({
    onSuccess: () => {
      toast.success("Product deleted successfully");
      utils.product.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`Error deleting product: ${error.message}`);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      unit: "",
    },
  });

  // Handle form submission for create/update
  const onSubmit = (data: ProductFormValues) => {
    if (selectedProduct) {
      updateProduct({
        id: selectedProduct.id,
        ...data,
      });
    } else {
      createProduct(data);
    }
  };

  // Setup for edit mode
  const handleEdit = (product: { id: string } & ProductFormValues) => {
    setSelectedProduct(product);
    setValue("name", product.name);
    setValue("description", product.description || "");
    setValue("price", product.price);
    setValue("unit", product.unit);
    onOpen();
  };

  // Handle delete confirmation
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProduct({ id });
    }
  };

  // Open modal for new product
  const handleAdd = () => {
    setSelectedProduct(null);
    reset({
      name: "",
      description: "",
      price: 0,
      unit: "",
    });
    onOpen();
  };

  // Filter products based on search input
  const filteredProducts = productsData
    ? productsData.filter((product) =>
        product.name.toLowerCase().includes(filter.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(filter.toLowerCase()))
      )
    : [];

  // Pagination logic
  const pages = Math.ceil((filteredProducts?.length || 0) / rowsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <p className="text-default-500">
          Manage your products catalog for use in quotes
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full max-w-md">
            <Input
              placeholder="Search products..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              startContent={<Search className="h-4 w-4 text-default-400" />}
              aria-label="Search products"
            />
          </div>
          <Button
            color="primary"
            onClick={handleAdd}
            startContent={<Plus className="h-4 w-4" />}
            aria-label="Add new product"
          >
            Add Product
          </Button>
        </CardHeader>

        {isLoading ? (
          <div className="flex h-80 items-center justify-center" aria-live="polite" aria-busy="true">
            <Spinner label="Loading products..." />
          </div>
        ) : error ? (
          <div className="flex h-80 flex-col items-center justify-center gap-2 p-4 text-center" role="alert">
            <AlertCircle className="h-10 w-10 text-danger" />
            <p className="text-xl font-semibold">Error loading products</p>
            <p className="text-default-500">{error.message}</p>
            <Button color="primary" onClick={() => utils.product.getAll.invalidate()}>
              Try Again
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center gap-2 p-4 text-center">
            <p className="text-xl font-semibold">No products found</p>
            <p className="text-default-500">
              {filter
                ? "Try a different search term or clear the filter"
                : "Add your first product to get started"}
            </p>
          </div>
        ) : (
          <>
            <Table 
              aria-label="Products table" 
              selectionMode="none"
              bottomContent={
                pages > 1 ? (
                  <div className="flex w-full justify-center">
                    <Pagination
                      page={page}
                      total={pages}
                      onChange={setPage}
                      aria-label="Pagination for products table"
                    />
                  </div>
                ) : null
              }
            >
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>DESCRIPTION</TableColumn>
                <TableColumn>PRICE</TableColumn>
                <TableColumn>UNIT</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      {product.description ? (
                        product.description
                      ) : (
                        <span className="text-default-400">No description</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip color="success">${product.price.toFixed(2)}</Chip>
                    </TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onClick={() => handleEdit(product)}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onClick={() => handleDelete(product.id)}
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Card>

      {/* Create/Edit Product Modal */}
      <Modal isOpen={isOpen} onClose={onClose} aria-labelledby="product-modal-title">
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <ModalHeader id="product-modal-title">
              {selectedProduct ? "Edit Product" : "Add New Product"}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div>
                  <Input
                    label="Product Name"
                    placeholder="Enter product name"
                    {...register("name")}
                    isInvalid={!!errors.name}
                    errorMessage={errors.name?.message}
                    aria-required="true"
                    aria-describedby={errors.name ? "name-error" : undefined}
                    fullWidth
                  />
                  {errors.name && (
                    <span id="name-error" className="sr-only">
                      {errors.name.message}
                    </span>
                  )}
                </div>

                <div>
                  <Input
                    label="Description (Optional)"
                    placeholder="Enter product description"
                    {...register("description")}
                    fullWidth
                  />
                </div>

                <div>
                  <Input
                    type="number"
                    label="Price"
                    placeholder="0.00"
                    startContent={<span className="text-default-400">$</span>}
                    {...register("price")}
                    isInvalid={!!errors.price}
                    errorMessage={errors.price?.message}
                    aria-required="true"
                    aria-describedby={errors.price ? "price-error" : undefined}
                    fullWidth
                  />
                  {errors.price && (
                    <span id="price-error" className="sr-only">
                      {errors.price.message}
                    </span>
                  )}
                </div>

                <div>
                  <Input
                    label="Unit"
                    placeholder="e.g., each, sq ft, hour"
                    {...register("unit")}
                    isInvalid={!!errors.unit}
                    errorMessage={errors.unit?.message}
                    aria-required="true"
                    aria-describedby={errors.unit ? "unit-error" : undefined}
                    fullWidth
                  />
                  {errors.unit && (
                    <span id="unit-error" className="sr-only">
                      {errors.unit.message}
                    </span>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="flat" 
                onPress={onClose}
                type="button"
                aria-label="Cancel and close form"
              >
                Cancel
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={isCreating || isUpdating}
                aria-label={selectedProduct ? "Save product changes" : "Create new product"}
              >
                {selectedProduct ? "Save Changes" : "Create Product"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
} 