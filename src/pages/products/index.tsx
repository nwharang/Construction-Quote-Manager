import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { 
  Button, 
  Card, 
  CardBody, 
  Input, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Spinner,
  Breadcrumbs,
  BreadcrumbItem
} from '@nextui-org/react';

// Mock data for products - in a real app, this would come from tRPC
const DUMMY_PRODUCTS = [
  {
    id: '1',
    name: 'Oak Cabinet',
    description: 'Standard size oak cabinet for kitchen installation',
    cost: '175.00',
    unit: 'piece',
  },
  {
    id: '2',
    name: 'Granite Countertop',
    description: 'Premium granite countertop material, price per square foot',
    cost: '65.00',
    unit: 'sq ft',
  },
  {
    id: '3',
    name: 'Cabinet Hardware',
    description: 'Handle and hinge set for standard cabinets',
    cost: '8.50',
    unit: 'set',
  },
  {
    id: '4',
    name: 'Ceramic Tile',
    description: 'Standard ceramic tile for flooring, price per square foot',
    cost: '3.75',
    unit: 'sq ft',
  },
];

export default function ProductsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState(DUMMY_PRODUCTS);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    id: '',
    name: '',
    description: '',
    cost: '',
    unit: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  
  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }
  
  // Not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  
  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Format currency helper
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(value));
  };
  
  // Open modal for adding a new product
  const openAddModal = () => {
    setCurrentProduct({
      id: '',
      name: '',
      description: '',
      cost: '',
      unit: '',
    });
    setIsEditing(false);
    setShowModal(true);
  };
  
  // Open modal for editing an existing product
  const openEditModal = (product: any) => {
    setCurrentProduct({ ...product });
    setIsEditing(true);
    setShowModal(true);
  };
  
  // Handle input change in modal
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cost') {
      const numValue = value.replace(/[^\d.]/g, '');
      setCurrentProduct({
        ...currentProduct,
        [name]: numValue
      });
    } else {
      setCurrentProduct({
        ...currentProduct,
        [name]: value
      });
    }
  };
  
  // Save product
  const saveProduct = () => {
    if (isEditing) {
      // Update existing product
      setProducts(products.map(product => 
        product.id === currentProduct.id ? currentProduct : product
      ));
    } else {
      // Add new product
      const newProduct = {
        ...currentProduct,
        id: Date.now().toString(),
      };
      setProducts([...products, newProduct]);
    }
    
    setShowModal(false);
  };
  
  // Delete product
  const deleteProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(product => product.id !== id));
    }
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs className="mb-5">
        <BreadcrumbItem>Products</BreadcrumbItem>
      </Breadcrumbs>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={openAddModal}
          className="mt-2 sm:mt-0"
        >
          Add Product
        </Button>
      </div>
      
      {/* Search */}
      <Card className="bg-content1 shadow-sm mb-6">
        <CardBody>
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<Search className="text-default-400" size={18} />}
            variant="bordered"
            classNames={{
              inputWrapper: "bg-transparent"
            }}
          />
        </CardBody>
      </Card>
      
      {/* Products List */}
      <Card className="bg-content1 shadow-sm">
        <CardBody className="p-0">
          {/* Table for all screens */}
          <Table aria-label="Products table" className="min-w-full">
            <TableHeader>
              <TableColumn>PRODUCT</TableColumn>
              <TableColumn>DESCRIPTION</TableColumn>
              <TableColumn>UNIT</TableColumn>
              <TableColumn>COST</TableColumn>
              <TableColumn className="text-right">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                    </TableCell>
                    <TableCell>
                      <div>{product.description}</div>
                    </TableCell>
                    <TableCell>
                      <div>{product.unit}</div>
                    </TableCell>
                    <TableCell>
                      <div>{formatCurrency(product.cost)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="primary"
                          onPress={() => openEditModal(product)}
                          aria-label="Edit product"
                        >
                          <Edit size={18} />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => deleteProduct(product.id)}
                          aria-label="Delete product"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="text-center py-12">
                      <p className="text-default-500 text-lg mb-4">No products found</p>
                      <Button
                        color="primary"
                        startContent={<Plus size={18} />}
                        onPress={openAddModal}
                      >
                        Add Product
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Product Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        placement="center"
        classNames={{
          body: "py-6",
          base: "bg-content1"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {isEditing ? 'Edit Product' : 'Add Product'}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    type="text"
                    id="product-name"
                    name="name"
                    label="Product Name"
                    value={currentProduct.name}
                    onChange={handleInputChange}
                    variant="bordered"
                    isRequired
                    classNames={{
                      inputWrapper: "bg-transparent"
                    }}
                  />
                  <Input
                    type="text"
                    id="product-description"
                    name="description"
                    label="Description"
                    value={currentProduct.description}
                    onChange={handleInputChange}
                    variant="bordered"
                    classNames={{
                      inputWrapper: "bg-transparent"
                    }}
                  />
                  <Input
                    type="text"
                    id="product-cost"
                    name="cost"
                    label="Cost"
                    value={currentProduct.cost}
                    onChange={handleInputChange}
                    variant="bordered"
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">$</span>
                      </div>
                    }
                    isRequired
                    classNames={{
                      inputWrapper: "bg-transparent"
                    }}
                  />
                  <Input
                    type="text"
                    id="product-unit"
                    name="unit"
                    label="Unit"
                    value={currentProduct.unit}
                    onChange={handleInputChange}
                    variant="bordered"
                    isRequired
                    classNames={{
                      inputWrapper: "bg-transparent"
                    }}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={() => {
                  saveProduct();
                  onClose();
                }}>
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
} 