import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { LoadingCard } from '../components/Loading';
import { useToast } from '../components/Toast';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    todaySales: 0,
    monthlySales: 0,
    lowStock: 0,
    totalRevenue: 0,
    activeSuppliers: 0,
    activeCustomers: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await api.get('/dashboard');
      const { stats, recentSales, recentPurchases, topProducts } = response.data;

      setStats(stats);
      setRecentSales(recentSales || []);
      setRecentPurchases(recentPurchases || []);
      setTopProducts(topProducts || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
    <div className={`glass-card p-6 ${color} transform hover:scale-105 transition-all duration-300 cursor-pointer group`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-200">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-gray-800 transition-colors duration-200">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? '↗' : '↘'} {trend.value}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className="text-4xl opacity-20 group-hover:opacity-30 transition-opacity duration-200">
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your inventory.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon="📦"
          color="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
          subtitle="Active inventory items"
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Today's Sales"
          value={`PKR ${stats.todaySales.toLocaleString()}`}
          icon="💰"
          color="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
          subtitle="Revenue today"
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="Monthly Sales"
          value={`PKR ${stats.monthlySales.toLocaleString()}`}
          icon="📈"
          color="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
          subtitle="This month"
          trend={{ value: 15, positive: true }}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock}
          icon="⚠️"
          color="bg-gradient-to-br from-red-50 to-red-100 border-red-200"
          subtitle="Need attention"
          trend={{ value: 5, positive: false }}
        />
        <StatCard
          title="Total Revenue"
          value={`PKR ${stats.totalRevenue.toLocaleString()}`}
          icon="💎"
          color="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
          subtitle="All time"
        />
        <StatCard
          title="Active Suppliers"
          value={stats.activeSuppliers}
          icon="🏢"
          color="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200"
          subtitle="Supply partners"
        />
        <StatCard
          title="Active Customers"
          value={stats.activeCustomers}
          icon="👥"
          color="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200"
          subtitle="Customer base"
        />
        <StatCard
          title="System Health"
          value="98%"
          icon="❤️"
          color="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"
          subtitle="Operational status"
        />
      </div>

      {/* Charts and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Sales */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-2">💰</span>
                Recent Sales
              </h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">S</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Sale #{sale.id}</p>
                        <p className="text-sm text-gray-600">{sale.sale_date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">PKR {sale.total_amount.toLocaleString()}</p>
                      <p className="text-xs text-green-600">Completed</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No recent sales</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Purchases */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🛒</span>
                Recent Purchases
              </h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentPurchases.length > 0 ? (
                recentPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">P</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Purchase #{purchase.id}</p>
                        <p className="text-sm text-gray-600">{purchase.purchase_date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">PKR {purchase.total_amount.toLocaleString()}</p>
                      <p className="text-xs text-blue-600">Processed</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p>No recent purchases</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Top Products */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full btn-primary justify-start">
                <span className="mr-2">➕</span>
                Add New Product
              </button>
              <button className="w-full btn-secondary justify-start">
                <span className="mr-2">📦</span>
                Record Sale
              </button>
              <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 justify-start flex">
                <span className="mr-2">🛒</span>
                New Purchase
              </button>
              <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 justify-start flex">
                <span className="mr-2">📊</span>
                Generate Report
              </button>
            </div>
          </div>

          {/* Top Products */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🏆</span>
              Top Products
            </h3>
            <div className="space-y-3">
              {topProducts.length > 0 ? (
                topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-800' :
                        index === 2 ? 'bg-orange-300 text-orange-800' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-600">{product.category_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{product.stock_quantity}</p>
                      <p className="text-xs text-gray-600">in stock</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No products available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
