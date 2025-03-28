import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save } from 'lucide-react';

// Mock data for development - in a real app, this would come from tRPC
const QUOTE_MOCK = {
  id: '1',
  title: 'Kitchen Renovation',
  customerName: 'John Smith',
  customerEmail: 'john.smith@example.com',
  customerPhone: '(555) 123-4567',
  status: 'DRAFT',
  notes: 'Customer would like work to start in early June. Must complete before July 15th for a family event.',
  complexityCharge: '200.00',
  markupCharge: '300.00',
  tasks: [
    {
      id: 't1',
      description: 'Remove old cabinets and countertops',
      price: '600.00',
      materialType: 'lumpsum',
      estimatedMaterialsCostLumpSum: '0.00',
      materials: [],
    },
    {
      id: 't2',
      description: 'Install new cabinets',
      price: '1200.00',
      materialType: 'itemized',
      estimatedMaterialsCostLumpSum: '0.00',
      materials: [
        { id: 'm1', description: 'Oak cabinets', quantity: 5, cost: '800.00' },
        { id: 'm2', description: 'Cabinet hardware', quantity: 20, cost: '160.00' },
      ],
    },
    {
      id: 't3',
      description: 'Install new countertops',
      price: '700.00',
      materialType: 'itemized',
      estimatedMaterialsCostLumpSum: '0.00',
      materials: [
        { id: 'm3', description: 'Granite countertops', quantity: 1, cost: '1200.00' },
      ],
    },
  ],
};

export default function EditQuotePage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
    complexityCharge: '0.00',
    markupCharge: '0.00',
  });
  
  // Tasks state
  const [tasks, setTasks] = useState<any[]>([]);
  
  // Material modal state
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentMaterial, setCurrentMaterial] = useState({
    id: '',
    description: '',
    quantity: 1,
    cost: '0.00'
  });
  const [editingMaterialIndex, setEditingMaterialIndex] = useState<number | null>(null);
  
  // Set initial form data (in a real app, this would use tRPC to fetch the data)
  useEffect(() => {
    if (id) {
      // Mock data fetch - would be replaced with tRPC query
      setFormData({
        title: QUOTE_MOCK.title,
        customerName: QUOTE_MOCK.customerName,
        customerEmail: QUOTE_MOCK.customerEmail,
        customerPhone: QUOTE_MOCK.customerPhone,
        notes: QUOTE_MOCK.notes,
        complexityCharge: QUOTE_MOCK.complexityCharge,
        markupCharge: QUOTE_MOCK.markupCharge,
      });
      
      setTasks(QUOTE_MOCK.tasks.map(task => ({
        ...task,
        materials: task.materials || []
      })));
    }
  }, [id]);
  
  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  
  // Helper to format currency input
  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(/[^\d.]/g, ''));
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };
  
  // Calculate totals
  const calculateTotals = () => {
    let subtotalTasks = 0;
    let subtotalMaterials = 0;
    
    tasks.forEach(task => {
      subtotalTasks += parseFloat(task.price);
      
      if (task.materialType === 'lumpsum') {
        subtotalMaterials += parseFloat(task.estimatedMaterialsCostLumpSum);
      } else {
        task.materials.forEach((material: any) => {
          subtotalMaterials += parseFloat(material.cost) * material.quantity;
        });
      }
    });
    
    const complexityCharge = parseFloat(formData.complexityCharge) || 0;
    const markupCharge = parseFloat(formData.markupCharge) || 0;
    const grandTotal = subtotalTasks + subtotalMaterials + complexityCharge + markupCharge;
    
    return {
      subtotalTasks: subtotalTasks.toFixed(2),
      subtotalMaterials: subtotalMaterials.toFixed(2),
      complexityCharge: complexityCharge.toFixed(2),
      markupCharge: markupCharge.toFixed(2),
      grandTotal: grandTotal.toFixed(2)
    };
  };
  
  const totals = calculateTotals();
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'complexityCharge' || name === 'markupCharge') {
      setFormData({
        ...formData,
        [name]: formatCurrency(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle task input change
  const handleTaskChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newTasks = [...tasks];
    
    if (name === 'price' || name === 'estimatedMaterialsCostLumpSum') {
      newTasks[index] = {
        ...newTasks[index],
        [name]: formatCurrency(value)
      };
    } else if (name === 'materialType') {
      newTasks[index] = {
        ...newTasks[index],
        [name]: value
      };
    } else {
      newTasks[index] = {
        ...newTasks[index],
        [name]: value
      };
    }
    
    setTasks(newTasks);
  };
  
  // Add a new task
  const addTask = () => {
    setTasks([...tasks, {
      id: Date.now().toString(),
      description: '',
      price: '0.00',
      materialType: 'lumpsum',
      estimatedMaterialsCostLumpSum: '0.00',
      materials: []
    }]);
  };
  
  // Remove a task
  const removeTask = (index: number) => {
    if (tasks.length === 1) {
      // Don't remove the last task, just reset it
      setTasks([{
        id: Date.now().toString(),
        description: '',
        price: '0.00',
        materialType: 'lumpsum',
        estimatedMaterialsCostLumpSum: '0.00',
        materials: []
      }]);
    } else {
      const newTasks = [...tasks];
      newTasks.splice(index, 1);
      setTasks(newTasks);
    }
  };
  
  // Open material modal
  const openMaterialModal = (taskIndex: number, materialIndex?: number) => {
    setCurrentTaskIndex(taskIndex);
    
    if (materialIndex !== undefined) {
      setEditingMaterialIndex(materialIndex);
      setCurrentMaterial({...tasks[taskIndex].materials[materialIndex]});
    } else {
      setEditingMaterialIndex(null);
      setCurrentMaterial({
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        cost: '0.00'
      });
    }
    
    setShowMaterialModal(true);
  };
  
  // Handle material input change
  const handleMaterialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'quantity') {
      setCurrentMaterial({
        ...currentMaterial,
        [name]: parseInt(value) || 1
      });
    } else if (name === 'cost') {
      setCurrentMaterial({
        ...currentMaterial,
        [name]: formatCurrency(value)
      });
    } else {
      setCurrentMaterial({
        ...currentMaterial,
        [name]: value
      });
    }
  };
  
  // Save material
  const saveMaterial = () => {
    const newTasks = [...tasks];
    
    if (editingMaterialIndex !== null) {
      // Edit existing material
      newTasks[currentTaskIndex].materials[editingMaterialIndex] = {...currentMaterial};
    } else {
      // Add new material
      newTasks[currentTaskIndex].materials.push({...currentMaterial});
    }
    
    setTasks(newTasks);
    setShowMaterialModal(false);
  };
  
  // Remove material
  const removeMaterial = (taskIndex: number, materialIndex: number) => {
    const newTasks = [...tasks];
    newTasks[taskIndex].materials.splice(materialIndex, 1);
    setTasks(newTasks);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would call a tRPC mutation to update the quote
    console.log('Updating quote with data:', { id, ...formData, tasks, ...totals });
    
    // Navigate back to quote detail
    router.push(`/quotes/${id}`);
  };
  
  return (
    <>
      <Head>
        <title>Edit Quote | Construction Quote Manager</title>
      </Head>
      
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push(`/quotes/${id}`)}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Quote
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Quote</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
            {/* Basic Quote Information */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quote Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quote Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Customer Information */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="customerEmail"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Tasks and Materials section would be identical to the new quote page */}
            {/* For brevity, I'm omitting the identical task form code here */}
            
            {/* Notes */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notes</h2>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Add any notes or special instructions here..."
              ></textarea>
            </div>
            
            {/* Adjustments and Totals */}
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quote Adjustments & Totals</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="complexityCharge" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Complexity/Contingency Charge
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                    </div>
                    <input
                      type="text"
                      id="complexityCharge"
                      name="complexityCharge"
                      value={formData.complexityCharge}
                      onChange={handleInputChange}
                      className="block w-full pl-7 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="markupCharge" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Markup/Profit Charge
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                    </div>
                    <input
                      type="text"
                      id="markupCharge"
                      name="markupCharge"
                      value={formData.markupCharge}
                      onChange={handleInputChange}
                      className="block w-full pl-7 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal (Tasks)</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">${totals.subtotalTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal (Materials)</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">${totals.subtotalMaterials}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Complexity/Contingency Charge</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">${totals.complexityCharge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Markup/Profit Charge</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">${totals.markupCharge}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    <span className="text-base font-medium text-gray-900 dark:text-white">Grand Total</span>
                    <span className="text-base font-bold text-gray-900 dark:text-white">${totals.grandTotal}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push(`/quotes/${id}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="-ml-1 mr-2 h-5 w-5" />
              Update Quote
            </button>
          </div>
        </form>
        
        {/* Material Modal would go here, identical to the new quote page */}
      </div>
    </>
  );
} 