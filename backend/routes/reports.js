const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

const queryAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

const queryOne = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || {});
    });
  });

const buildWhere = (clauses) => {
  if (!clauses.length) return '';
  return 'WHERE ' + clauses.join(' AND ');
};

// Paginated list endpoint for reports UI
router.get('/list', authenticate, async (req, res) => {
  try {
    const {
      type,
      page = 1,
      pageSize = 10,
      search,
      dateFrom,
      dateTo,
      category,
      supplier
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const size = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 10000);
    const offset = (pageNum - 1) * size;

    let baseSql = '';
    let countSql = '';
    const params = [];
    const clauses = [];

    switch (type) {
      case 'sales': {
        baseSql = `
          SELECT s.*, c.name as customer_name
          FROM sales s
          LEFT JOIN customers c ON s.customer_id = c.id
        `;
        countSql = `
          SELECT COUNT(*) as total
          FROM sales s
          LEFT JOIN customers c ON s.customer_id = c.id
        `;

        if (dateFrom) {
          clauses.push('DATE(s.sale_date) >= DATE(?)');
          params.push(dateFrom);
        }
        if (dateTo) {
          clauses.push('DATE(s.sale_date) <= DATE(?)');
          params.push(dateTo);
        }
        if (search) {
          clauses.push(`(
            CAST(s.id AS TEXT) LIKE ? OR
            s.sale_date LIKE ? OR
            s.payment_method LIKE ? OR
            CAST(s.total_amount AS TEXT) LIKE ? OR
            c.name LIKE ?
          )`);
          const q = `%${search}%`;
          params.push(q, q, q, q, q);
        }
        break;
      }
      case 'purchases': {
        baseSql = `
          SELECT p.*, s.name as supplier_name, s.company as supplier_company
          FROM purchases p
          LEFT JOIN suppliers s ON p.supplier_id = s.id
        `;
        countSql = `
          SELECT COUNT(*) as total
          FROM purchases p
          LEFT JOIN suppliers s ON p.supplier_id = s.id
        `;

        if (dateFrom) {
          clauses.push('DATE(p.purchase_date) >= DATE(?)');
          params.push(dateFrom);
        }
        if (dateTo) {
          clauses.push('DATE(p.purchase_date) <= DATE(?)');
          params.push(dateTo);
        }
        if (supplier) {
          clauses.push('s.name LIKE ?');
          params.push(`%${supplier}%`);
        }
        if (search) {
          clauses.push(`(
            CAST(p.id AS TEXT) LIKE ? OR
            p.purchase_date LIKE ? OR
            CAST(p.total_amount AS TEXT) LIKE ? OR
            s.name LIKE ? OR
            s.company LIKE ?
          )`);
          const q = `%${search}%`;
          params.push(q, q, q, q, q);
        }
        break;
      }
      case 'inventory': {
        baseSql = `
          SELECT p.*, c.name as category_name, s.name as supplier_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN suppliers s ON p.supplier_id = s.id
        `;
        countSql = `
          SELECT COUNT(*) as total
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN suppliers s ON p.supplier_id = s.id
        `;

        if (category) {
          clauses.push('c.name LIKE ?');
          params.push(`%${category}%`);
        }
        if (supplier) {
          clauses.push('s.name LIKE ?');
          params.push(`%${supplier}%`);
        }
        if (search) {
          clauses.push(`(
            p.name LIKE ? OR
            p.brand LIKE ? OR
            p.model LIKE ? OR
            p.barcode LIKE ? OR
            c.name LIKE ? OR
            s.name LIKE ?
          )`);
          const q = `%${search}%`;
          params.push(q, q, q, q, q, q);
        }
        break;
      }
      case 'financial': {
        const summary = await queryOne(`
          SELECT
            COALESCE(SUM(s.total_amount), 0) as totalSales,
            COALESCE((SELECT SUM(p.total_amount) FROM purchases p), 0) as totalPurchases,
            COALESCE(SUM(s.total_amount), 0) - COALESCE((SELECT SUM(p.total_amount) FROM purchases p), 0) as netProfit,
            COALESCE(COUNT(s.id), 0) as salesCount
          FROM sales s
        `);
        const purchasesCountRow = await queryOne('SELECT COUNT(*) as purchasesCount FROM purchases');
        const averageSale = summary.salesCount ? summary.totalSales / summary.salesCount : 0;
        const averagePurchase = purchasesCountRow.purchasesCount
          ? summary.totalPurchases / purchasesCountRow.purchasesCount
          : 0;

        return res.json({
          rows: [{
            ...summary,
            purchasesCount: purchasesCountRow.purchasesCount || 0,
            averageSale,
            averagePurchase
          }],
          total: 1
        });
      }
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    const where = buildWhere(clauses);
    const rows = await queryAll(
      `${baseSql} ${where} ORDER BY 1 DESC LIMIT ? OFFSET ?`,
      [...params, size, offset]
    );
    const countRow = await queryOne(`${countSql} ${where}`, params);

    res.json({ rows, total: countRow.total || 0 });
  } catch (error) {
    console.error('Report list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
