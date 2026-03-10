import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    todaySales: 0,
    monthlySales: 0,
    lowStock: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [productsRes, salesRes, purchasesRes] = await Promise.all([
        api.get('/products'),
        api.get('/sales'),
        api.get('/purchases'),
      ]);

      const products = productsRes.data;
      const sales = salesRes.data;
      const purchases = purchasesRes.data;

      // Calculate stats
      const totalProducts = products.length;
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);

      const todaySales = sales
        .filter(sale => sale.sale_date === today)
        .reduce((sum, sale) => sum + sale.total_amount, 0);

      const monthlySales = sales
        .filter(sale => sale.sale_date.startsWith(thisMonth))
        .reduce((sum, sale) => sum + sale.total_amount, 0);

      const lowStock = products.filter(product => product.stock_quantity <= product.minimum_stock).length;

      setStats({
        totalProducts,
        todaySales,
        monthlySales,
        lowStock,
      });

      setRecentSales(sales.slice(0, 5));
      setRecentPurchases(purchases.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Products</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Today's Sales</h3>
          <p className="text-3xl font-bold text-green-600">PKR {stats.todaySales.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Monthly Sales</h3>
          <p className="text-3xl font-bold text-green-600">PKR {stats.monthlySales.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Low Stock Items</h3>
          <p className="text-3xl font-bold text-red-600">{stats.lowStock}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Sales</h3>
          <div className="space-y-2">
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">Sale #{sale.id}</p>
                    <p className="text-sm text-gray-600">{sale.sale_date}</p>
                  </div>
                  <p className="font-semibold">PKR {sale.total_amount.toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent sales</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Purchases</h3>
          <div className="space-y-2">
            {recentPurchases.length > 0 ? (
              recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">Purchase #{purchase.id}</p>
                    <p className="text-sm text-gray-600">{purchase.purchase_date}</p>
                  </div>
                  <p className="font-semibold">PKR {purchase.total_amount.toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent purchases</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;