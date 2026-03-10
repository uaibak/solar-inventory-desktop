const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

// Unified reports endpoint
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, start_date, end_date } = req.query;

    let sql = '';
    let params = [];

    switch (type) {
      case 'daily_sales':
        sql = `
          SELECT
            DATE(sale_date) as date,
            COUNT(*) as total_sales,
            SUM(total_amount) as total_amount
          FROM sales
          WHERE DATE(sale_date) BETWEEN ? AND ?
          GROUP BY DATE(sale_date)
          ORDER BY date DESC
        `;
        params = [start_date, end_date];
        break;

      case 'monthly_sales':
        sql = `
          SELECT
            strftime('%Y-%m', sale_date) as date,
            COUNT(*) as total_sales,
            SUM(total_amount) as total_amount
          FROM sales
          WHERE DATE(sale_date) BETWEEN ? AND ?
          GROUP BY strftime('%Y-%m', sale_date)
          ORDER BY date DESC
        `;
        params = [start_date, end_date];
        break;

      case 'inventory_stock':
        sql = `
          SELECT
            p.name,
            c.name as category,
            p.stock_quantity,
            p.sale_price
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          ORDER BY p.name
        `;
        break;

      case 'low_stock':
        sql = `
          SELECT
            p.name,
            p.stock_quantity,
            p.minimum_stock
          FROM products p
          WHERE p.stock_quantity <= p.minimum_stock
          ORDER BY p.stock_quantity ASC
        `;
        break;

      case 'purchase_history':
        sql = `
          SELECT
            pu.purchase_date,
            s.name as supplier_name,
            pu.total_amount
          FROM purchases pu
          LEFT JOIN suppliers s ON pu.supplier_id = s.id
          WHERE DATE(pu.purchase_date) BETWEEN ? AND ?
          ORDER BY pu.purchase_date DESC
        `;
        params = [start_date, end_date];
        break;

      case 'profit_report':
        sql = `
          SELECT
            strftime('%Y-%m', s.sale_date) as period,
            SUM(s.total_amount) as sales_revenue,
            SUM((p.sale_price - p.purchase_price) * si.quantity) as cost_of_goods,
            SUM(s.total_amount) - SUM((p.sale_price - p.purchase_price) * si.quantity) as profit
          FROM sales s
          LEFT JOIN sale_items si ON s.id = si.sale_id
          LEFT JOIN products p ON si.product_id = p.id
          WHERE DATE(s.sale_date) BETWEEN ? AND ?
          GROUP BY strftime('%Y-%m', s.sale_date)
          ORDER BY period DESC
        `;
        params = [start_date, end_date];
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    db.getDb().all(sql, params, (err, rows) => {
      if (err) {
        console.error('Report generation error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;