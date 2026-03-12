import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [formData, setFormData] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
  });
  const { success, error } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/products'),
      ]);
      setPurchases(purchasesRes.data);
      setSuppliers(suppliersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPurchaseItem = () => {
    setPurchaseItems([...purchaseItems, {
      product_id: '',
      quantity: 1,
      price: 0,
      subtotal: 0,
    }]);
  };

  const updatePurchaseItem = (index, field, value) => {
    const updatedItems = [...purchaseItems];
    updatedItems[index][field] = value;

    if (field === 'product_id' || field === 'quantity' || field === 'price') {
      const productId = Number(updatedItems[index].product_id);
      const product = products.find(p => p.id === productId);
      if (product && updatedItems[index].quantity && updatedItems[index].price) {
        updatedItems[index].subtotal = updatedItems[index].quantity * updatedItems[index].price;
      }
    }

    setPurchaseItems(updatedItems);
  };

  const removePurchaseItem = (index) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return purchaseItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const purchaseData = {
        ...formData,
        items: purchaseItems,
        total_amount: calculateTotal(),
      };

      await api.post('/purchases', purchaseData);
      await fetchData();
      setShowForm(false);
      resetForm();
      success('Purchase created successfully');
    } catch (error) {
      console.error('Error creating purchase:', error);
      error('Failed to create purchase');
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      purchase_date: new Date().toISOString().split('T')[0],
    });
    setPurchaseItems([]);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  if (loading) {
    return <div className="text-center py-8">Loading purchases...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Purchases</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          New Purchase
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchase ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{purchase.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {suppliers.find(s => s.id === purchase.supplier_id)?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {purchase.purchase_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  PKR {purchase.total_amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Purchase</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier *</label>
                    <select
                      required
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Date *</label>
                    <input
                      type="date"
                      required
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium text-gray-900">Purchase Items *</h4>
                    <button
                      type="button"
                      onClick={addPurchaseItem}
                      className="bg-green-500 hover:bg-green-700 text-white text-sm font-bold py-1 px-3 rounded"
                    >
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {purchaseItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 border rounded">
                        <select
                          required
                          className="flex-1 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={item.product_id}
                          onChange={(e) => updatePurchaseItem(index, 'product_id', e.target.value)}
                        >
                        <option value="">Select Product *</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          className="w-20 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={item.quantity}
                          onChange={(e) => updatePurchaseItem(index, 'quantity', e.target.value)}
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="Price"
                          className="w-24 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={item.price}
                          onChange={(e) => updatePurchaseItem(index, 'price', e.target.value)}
                        />
                        <span className="w-24 text-right font-semibold">
                          PKR {item.subtotal.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePurchaseItem(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {purchaseItems.length > 0 && (
                    <div className="mt-4 text-right">
                      <p className="text-lg font-bold">Total: PKR {calculateTotal().toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Purchase
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Purchases;
