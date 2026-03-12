import React, { useContext, Suspense, lazy } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import { PageLoading } from './components/Loading';
import Login from './pages/Login';
import RegisterAdmin from './pages/RegisterAdmin';
import Layout from './layouts/Layout';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Categories = lazy(() => import('./pages/Categories'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Customers = lazy(() => import('./pages/Customers'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Sales = lazy(() => import('./pages/Sales'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

function AppContent() {
  const { user, loading, needsSetup } = useContext(AuthContext);
  const isFileProtocol =
    typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
  const Router = isFileProtocol ? HashRouter : BrowserRouter;

  if (loading) {
    return <PageLoading message="Initializing application..." />;
  }

  if (needsSetup) {
    return (
      <Router>
        <div className="fade-in">
          <Routes>
            <Route path="/register" element={<RegisterAdmin />} />
            <Route path="*" element={<Navigate to="/register" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="fade-in">
        <Suspense fallback={<PageLoading message="Loading page..." />}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="customers" element={<Customers />} />
              <Route path="purchases" element={<Purchases />} />
            <Route path="sales" element={<Sales />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
