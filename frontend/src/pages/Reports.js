import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { LoadingCard } from '../components/Loading';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import Filters from '../components/Filters';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';

function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportModal, setExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    supplier: '',
    search: '',
  });
  const { success, error } = useToast();

  const tabs = [
    { id: 'sales', label: 'Sales Report', icon: '💰' },
    { id: 'purchases', label: 'Purchase Report', icon: '🛒' },
    { id: 'inventory', label: 'Inventory Report', icon: '📦' },
    { id: 'financial', label: 'Financial Summary', icon: '📊' },
  ];
  const searchPlaceholder = 'Search records...';

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 250);
    return () => clearTimeout(handle);
  }, [filters.search]);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/list', {
        params: {
          type: activeTab,
          page: currentPage,
          pageSize: itemsPerPage,
          search: debouncedSearch || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          category: filters.category || undefined,
          supplier: filters.supplier || undefined
        }
      });

      setData(response.data.rows || []);
      setTotalRecords(response.data.total || 0);
    } catch (err) {
      console.error('Error fetching report data:', err);
      error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, itemsPerPage, debouncedSearch, filters, error]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleExport = async () => {
    try {
      const exportResponse = await api.get('/reports/list', {
        params: {
          type: activeTab,
          page: 1,
          pageSize: 10000,
          search: filters.search || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          category: filters.category || undefined,
          supplier: filters.supplier || undefined
        }
      });

      const exportData = (exportResponse.data.rows || []).map(item => {
        const cleanItem = { ...item };
        // Remove any circular references or complex objects
        Object.keys(cleanItem).forEach(key => {
          if (typeof cleanItem[key] === 'object' && cleanItem[key] !== null) {
            cleanItem[key] = JSON.stringify(cleanItem[key]);
          }
        });
        return cleanItem;
      });

      if (exportFormat === 'csv') {
        const csvContent = convertToCSV(exportData);
        downloadFile(csvContent, `${activeTab}-report.csv`, 'text/csv');
      } else if (exportFormat === 'json') {
        const jsonContent = JSON.stringify(exportData, null, 2);
        downloadFile(jsonContent, `${activeTab}-report.json`, 'application/json');
      }

      success(`Report exported successfully as ${exportFormat.toUpperCase()}`);
      setExportModal(false);
    } catch (err) {
      console.error('Export error:', err);
      error('Failed to export report');
    }
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return '';

    const normalizeCsvValue = (value, header) => {
      if (value === null || value === undefined) return '';

      // Normalize date-like fields for CSV parsing (YYYY-MM-DD)
      const headerLooksLikeDate = typeof header === 'string' && header.toLowerCase().includes('date');
      if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
      }
      if (headerLooksLikeDate && typeof value === 'string') {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString().slice(0, 10);
        }
      }

      return value;
    };

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = normalizeCsvValue(row[header], header);
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getTableColumns = () => {
    switch (activeTab) {
      case 'sales':
        return [
          { key: 'id', label: 'ID', sortable: true },
          { key: 'sale_date', label: 'Date', sortable: true },
          { key: 'customer_name', label: 'Customer', sortable: true },
          { key: 'total_amount', label: 'Amount', sortable: true, format: (value) => `PKR ${Number(value || 0).toLocaleString()}` },
          { key: 'payment_method', label: 'Payment', sortable: true },
        ];
      case 'purchases':
        return [
          { key: 'id', label: 'ID', sortable: true },
          { key: 'purchase_date', label: 'Date', sortable: true },
          { key: 'supplier_name', label: 'Supplier', sortable: true },
          { key: 'total_amount', label: 'Amount', sortable: true, format: (value) => `PKR ${Number(value || 0).toLocaleString()}` },
          { key: 'status', label: 'Status', sortable: true },
        ];
      case 'inventory':
        return [
          { key: 'id', label: 'ID', sortable: true },
          { key: 'name', label: 'Product', sortable: true },
          { key: 'category_name', label: 'Category', sortable: true },
          { key: 'stock_quantity', label: 'Stock', sortable: true },
          { key: 'unit_price', label: 'Price', sortable: true, format: (value) => `PKR ${Number(value || 0).toLocaleString()}` },
          { key: 'supplier_name', label: 'Supplier', sortable: true },
        ];
      case 'financial':
        return [
          { key: 'totalSales', label: 'Total Sales', format: (value) => `PKR ${Number(value || 0).toLocaleString()}` },
          { key: 'totalPurchases', label: 'Total Purchases', format: (value) => `PKR ${Number(value || 0).toLocaleString()}` },
          { key: 'netProfit', label: 'Net Profit', format: (value) => `PKR ${Number(value || 0).toLocaleString()}` },
          { key: 'salesCount', label: 'Sales Count' },
          { key: 'purchasesCount', label: 'Purchases Count' },
          { key: 'averageSale', label: 'Avg Sale', format: (value) => `PKR ${Number(value || 0).toLocaleString()}` },
        ];
      default:
        return [];
    }
  };

  const paginatedData = data;
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        </div>
        <div className="space-y-4">
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setExportModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card p-1">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <Filters
        filters={filters}
        onFilterChange={handleFilterChange}
        showDateRange={activeTab !== 'inventory' && activeTab !== 'financial'}
        showCategory={activeTab === 'inventory'}
        showSupplier={activeTab === 'purchases' || activeTab === 'inventory'}
        showSearch={true}
        searchPlaceholder={searchPlaceholder}
        searchHelpText="Tip: use customer, supplier, product names or amounts"
      />

      {/* Summary Cards */}
      {activeTab !== 'financial' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalRecords}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          {activeTab === 'sales' && (
            <>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  PKR {data.reduce((sum, item) => sum + item.total_amount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  PKR {(data.reduce((sum, item) => sum + item.total_amount, 0) / Math.max(data.length, 1)).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Average Sale</div>
              </div>
            </>
          )}
          {activeTab === 'purchases' && (
            <>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  PKR {data.reduce((sum, item) => sum + item.total_amount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  PKR {(data.reduce((sum, item) => sum + item.total_amount, 0) / Math.max(data.length, 1)).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Average Purchase</div>
              </div>
            </>
          )}
          {activeTab === 'inventory' && (
            <>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data.reduce((sum, item) => sum + item.stock_quantity, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Stock</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {data.filter(item => item.stock_quantity <= item.minimum_stock).length}
                </div>
                <div className="text-sm text-gray-600">Low Stock Items</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Financial Summary Special Display */}
      {activeTab === 'financial' && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(data[0]).map(([key, value]) => (
            <div key={key} className="glass-card p-6 text-center">
              <div className={`text-3xl font-bold ${
                key.includes('Profit') ? (value > 0 ? 'text-green-600' : 'text-red-600') :
                key.includes('Sales') ? 'text-blue-600' :
                key.includes('Purchases') ? 'text-orange-600' : 'text-purple-600'
              }`}>
                {(typeof value === 'number' && (key.includes('amount') || key.includes('Sale') || key.includes('Purchase') || key.includes('Profit')))
                  ? `PKR ${Number(value || 0).toLocaleString()}`
                  : (value == null ? '-' : value.toLocaleString())
                }
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Table */}
      <div className="glass-card">
        <DataTable
          columns={getTableColumns()}
          data={paginatedData}
          loading={loading}
          emptyMessage={`No ${activeTab} data found`}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Export Modal */}
      <Modal
        isOpen={exportModal}
        onClose={() => setExportModal(false)}
        title="Export Report"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="csv">CSV (Comma Separated Values)</option>
              <option value="json">JSON (JavaScript Object Notation)</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setExportModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="btn-primary"
            >
              Export
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Reports;
