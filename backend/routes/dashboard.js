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
      topProducts
    ] = await Promise.all([
      getSingle('SELECT COUNT(*) as count FROM products'),
      getSingle('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= minimum_stock'),
      getSingle('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales'),
      getSingle('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE sale_date = ?', [today]),
      getSingle('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE strftime(\'%Y-%m\', sale_date) = ?', [thisMonth]),
      getSingle('SELECT COUNT(*) as count FROM suppliers'),
      getSingle('SELECT COUNT(*) as count FROM customers'),
      getAll(
        'SELECT id, sale_date, total_amount FROM sales ORDER BY sale_date DESC, id DESC LIMIT 5'
      ),
      getAll(
        'SELECT id, purchase_date, total_amount FROM purchases ORDER BY purchase_date DESC, id DESC LIMIT 5'
      ),
      getAll(
        `SELECT p.id, p.name, p.stock_quantity, c.name as category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         ORDER BY p.stock_quantity DESC, p.id DESC
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
      topProducts
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

module.exports = router;
