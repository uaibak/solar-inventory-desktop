const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

const getSingle = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || {});
    });
  });

const getAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

router.get('/', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = new Date().toISOString().slice(0, 7);

    const [
      totalProductsRow,
      lowStockRow,
      totalRevenueRow,
      todaySalesRow,
      monthlySalesRow,
      activeSuppliersRow,
      activeCustomersRow,
      recentSales,
      recentPurchases,
      topProducts,
      topCustomers,
      topSuppliers
    ] = await Promise.all([
      getSingle('SELECT COUNT(*) as count FROM products'),
      getSingle('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= minimum_stock'),
      getSingle('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales'),
      getSingle('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE sale_date = ?', [today]),
      getSingle('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE strftime(\'%Y-%m\', sale_date) = ?', [thisMonth]),
      getSingle('SELECT COUNT(*) as count FROM suppliers'),
      getSingle('SELECT COUNT(*) as count FROM customers'),
      getAll(
        `SELECT s.id, s.sale_date, s.total_amount, c.name as customer_name
         FROM sales s
         LEFT JOIN customers c ON s.customer_id = c.id
         ORDER BY s.sale_date DESC, s.id DESC
         LIMIT 5`
      ),
      getAll(
        `SELECT p.id, p.purchase_date, p.total_amount, s.name as supplier_name
         FROM purchases p
         LEFT JOIN suppliers s ON p.supplier_id = s.id
         ORDER BY p.purchase_date DESC, p.id DESC
         LIMIT 5`
      ),
      getAll(
        `SELECT p.id, p.name, c.name as category_name,
                COALESCE(SUM(si.quantity), 0) as units_sold,
                COALESCE(SUM(si.subtotal), 0) as revenue
         FROM products p
         LEFT JOIN sale_items si ON si.product_id = p.id
         LEFT JOIN categories c ON p.category_id = c.id
         GROUP BY p.id
         ORDER BY revenue DESC, units_sold DESC, p.id DESC
         LIMIT 5`
      ),
      getAll(
        `SELECT c.id, c.name,
                COALESCE(SUM(s.total_amount), 0) as revenue,
                COALESCE(COUNT(s.id), 0) as orders
         FROM customers c
         LEFT JOIN sales s ON s.customer_id = c.id
         GROUP BY c.id
         ORDER BY revenue DESC, orders DESC, c.id DESC
         LIMIT 5`
      ),
      getAll(
        `SELECT s.id, s.name,
                COALESCE(SUM(p.total_amount), 0) as spend,
                COALESCE(COUNT(p.id), 0) as orders
         FROM suppliers s
         LEFT JOIN purchases p ON p.supplier_id = s.id
         GROUP BY s.id
         ORDER BY spend DESC, orders DESC, s.id DESC
         LIMIT 5`
      )
    ]);

    res.json({
      stats: {
        totalProducts: totalProductsRow.count || 0,
        todaySales: todaySalesRow.total || 0,
        monthlySales: monthlySalesRow.total || 0,
        lowStock: lowStockRow.count || 0,
        totalRevenue: totalRevenueRow.total || 0,
        activeSuppliers: activeSuppliersRow.count || 0,
        activeCustomers: activeCustomersRow.count || 0
      },
      recentSales,
      recentPurchases,
      topProducts,
      topCustomers,
      topSuppliers
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

module.exports = router;
