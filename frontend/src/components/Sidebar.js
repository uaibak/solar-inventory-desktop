import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊', description: 'Overview & Analytics' },
    { path: '/products', label: 'Products', icon: '📦', description: 'Inventory Management' },
    { path: '/categories', label: 'Categories', icon: '🏷️', description: 'Product Categories' },
    { path: '/suppliers', label: 'Suppliers', icon: '🏢', description: 'Supplier Directory' },
    { path: '/customers', label: 'Customers', icon: '👥', description: 'Customer Database' },
    { path: '/purchases', label: 'Purchases', icon: '🛒', description: 'Stock Procurement' },
    { path: '/sales', label: 'Sales', icon: '💰', description: 'Sales Transactions' },
    { path: '/reports', label: 'Reports', icon: '📈', description: 'Analytics & Reports' },
    { path: '/settings', label: 'Settings', icon: '⚙️', description: 'System Preferences' },
  ];

  return (
    <div className={`bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64'
    } shadow-2xl relative h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SI</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Solar Inventory
                </h1>
                <p className="text-xs text-gray-400">Management System</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto pb-6">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group relative flex items-center px-3 py-2 rounded-lg transition-all duration-200 ease-in-out ${
                isActive
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full"></div>
              )}

              {/* Icon */}
              <div className={`flex items-center justify-center ${
                isCollapsed ? 'w-8 h-8' : 'w-9 h-9 mr-3'
              } ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'} transition-colors duration-200`}>
                <span className="text-lg">{item.icon}</span>
              </div>

              {/* Text */}
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'} transition-colors duration-200`}>
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors duration-200">
                    {item.description}
                  </div>
                </div>
              )}

              {/* Hover indicator */}
              {!isCollapsed && (
                <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-blue-300' : 'bg-transparent group-hover:bg-gray-500'
                }`}></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed && (
          <div className="text-center">
            <p className="text-xs text-gray-400">© 2026 Solar Inventory</p>
            <p className="text-xs text-gray-500 mt-1">Professional Management</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
