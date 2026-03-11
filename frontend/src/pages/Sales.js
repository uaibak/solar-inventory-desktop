import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

function Sales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    payment_method: 'cash',
    sale_date: new Date().toISOString().split('T')[0],
  });
  const { error, success } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesRes, customersRes, productsRes] = await Promise.all([
        api.get('/sales'),
        api.get('/customers'),
        api.get('/products'),
      ]);
      setSales(salesRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSaleItem = () => {
    setSaleItems([...saleItems, {
      product_id: '',
      quantity: 1,
      price: 0,
      subtotal: 0,
    }]);
  };

  const updateSaleItem = (index, field, value) => {
    const updatedItems = [...saleItems];
    updatedItems[index][field] = value;

    if (field === 'product_id') {
      const productId = Number(value);
      const product = products.find(p => p.id === productId);
      if (product) {
        updatedItems[index].price = product.sale_price;
        updatedItems[index].subtotal = updatedItems[index].quantity * product.sale_price;
      }
    } else if (field === 'quantity' || field === 'price') {
      updatedItems[index].subtotal = updatedItems[index].quantity * updatedItems[index].price;
    }

    setSaleItems(updatedItems);
  };

  const removeSaleItem = (index) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return saleItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const saleData = {
        ...formData,
        items: saleItems,
        total_amount: calculateTotal(),
      };

      await api.post('/sales', saleData);
      fetchData();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error creating sale:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      payment_method: 'cash',
      sale_date: new Date().toISOString().split('T')[0],
    });
    setSaleItems([]);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const printInvoice = (sale) => {
    handleViewInvoice(sale);
  };

  const handleViewInvoice = async (sale) => {
    setShowInvoice(true);
    setInvoiceLoading(true);
    try {
      const response = await api.get(`/sales/${sale.id}`);
      setInvoiceData(response.data);
    } catch (err) {
      console.error('Error loading invoice:', err);
      error('Failed to load invoice');
      setShowInvoice(false);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const closeInvoice = () => {
    setShowInvoice(false);
    setInvoiceData(null);
  };

  const formatCurrency = (value) => `PKR ${Number(value || 0).toLocaleString()}`;

  const buildInvoiceHtml = (sale) => {
    const items = sale.items || [];
    const rows = items.map(item => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${item.product_name || ''}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${formatCurrency(item.price)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.subtotal)}</td>
      </tr>
    `).join('');

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice #${sale.id}</title>
        </head>
        <body style="font-family:Arial, sans-serif; margin:24px; color:#111827;">
          <h2 style="margin:0 0 8px 0;">Invoice</h2>
          <div style="margin-bottom:16px; font-size:14px; color:#374151;">
            <div><strong>Invoice #</strong> ${sale.id}</div>
            <div><strong>Date</strong> ${sale.sale_date}</div>
            <div><strong>Payment</strong> ${sale.payment_method}</div>
          </div>
          <div style="margin-bottom:16px; font-size:14px; color:#374151;">
            <strong>Customer</strong><br />
            ${sale.customer_name || 'Walk-in Customer'}<br />
            ${sale.customer_email || ''}<br />
            ${sale.customer_phone || ''}<br />
            ${sale.customer_address || ''}
          </div>
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <thead>
              <tr>
                <th style="text-align:left; padding:8px; border-bottom:2px solid #111827;">Item</th>
                <th style="text-align:left; padding:8px; border-bottom:2px solid #111827;">Qty</th>
                <th style="text-align:left; padding:8px; border-bottom:2px solid #111827;">Price</th>
                <th style="text-align:right; padding:8px; border-bottom:2px solid #111827;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div style="margin-top:16px; text-align:right; font-size:16px;">
            <strong>Total: ${formatCurrency(sale.total_amount)}</strong>
          </div>
        </body>
      </html>
    `;
  };

  const downloadInvoicePdf = async () => {
    if (!invoiceData) return;
    const html = buildInvoiceHtml(invoiceData);
    const defaultFileName = `invoice-${invoiceData.id}.pdf`;

    try {
      if (window.electronAPI?.printToPDF) {
        const result = await window.electronAPI.printToPDF({
          html,
          defaultFileName
        });
        if (!result?.success) {
          error(result?.error || 'Failed to generate PDF');
        } else {
          success('Invoice PDF saved');
        }
        return;
      }

      // Fallback for browser mode
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
        w.close();
        success('Print dialog opened');
      } else {
        error('Popup blocked. Please allow popups to print.');
      }
    } catch (err) {
      console.error('PDF download error:', err);
      error('Failed to generate PDF');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading sales...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          New Sale
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sale ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{sale.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customers.find(c => c.id === sale.customer_id)?.name || 'Walk-in Customer'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.sale_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {sale.payment_method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  PKR {sale.total_amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => printInvoice(sale)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Invoice
                  </button>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Sale</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer (optional)</label>
                    <select
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={formData.customer_id}
                      onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                    >
                      <option value="">Walk-in Customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method *</label>
                    <select
                      required
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={formData.payment_method}
                      onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sale Date *</label>
                    <input
                      type="date"
                      required
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={formData.sale_date}
                      onChange={(e) => setFormData({...formData, sale_date: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium text-gray-900">Sale Items *</h4>
                    <button
                      type="button"
                      onClick={addSaleItem}
                      className="bg-green-500 hover:bg-green-700 text-white text-sm font-bold py-1 px-3 rounded"
                    >
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {saleItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 border rounded">
                        <select
                          required
                          className="flex-1 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={item.product_id}
                          onChange={(e) => updateSaleItem(index, 'product_id', e.target.value)}
                        >
                          <option value="">Select Product *</option>
                          {products.filter(p => p.stock_quantity > 0).map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} (Stock: {product.stock_quantity})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          className="w-20 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={item.quantity}
                          onChange={(e) => updateSaleItem(index, 'quantity', e.target.value)}
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="Price"
                          className="w-24 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={item.price}
                          onChange={(e) => updateSaleItem(index, 'price', e.target.value)}
                        />
                        <span className="w-24 text-right font-semibold">
                          PKR {item.subtotal.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSaleItem(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {saleItems.length > 0 && (
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
                    Create Sale
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showInvoice}
        onClose={closeInvoice}
        title={`Invoice #${invoiceData?.id || ''}`}
        size="lg"
      >
        {invoiceLoading && (
          <div className="text-center py-8 text-gray-600">Loading invoice...</div>
        )}

        {!invoiceLoading && invoiceData && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Invoice Details</h3>
                <p className="text-sm text-gray-600">Date: {invoiceData.sale_date}</p>
                <p className="text-sm text-gray-600">Payment: {invoiceData.payment_method}</p>
              </div>
              <button
                onClick={downloadInvoicePdf}
                className="btn-primary"
              >
                Download PDF
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
              <div className="font-medium text-gray-900">Customer</div>
              <div>{invoiceData.customer_name || 'Walk-in Customer'}</div>
              {invoiceData.customer_email && <div>{invoiceData.customer_email}</div>}
              {invoiceData.customer_phone && <div>{invoiceData.customer_phone}</div>}
              {invoiceData.customer_address && <div>{invoiceData.customer_address}</div>}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(invoiceData.items || []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.product_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="text-lg font-semibold text-gray-900">
                Total: {formatCurrency(invoiceData.total_amount)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Sales;
