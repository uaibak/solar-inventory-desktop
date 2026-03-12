const db = require('../database/db');
const Product = require('./Product');

class Sale {
  static create(saleData) {
    return new Promise(async (resolve, reject) => {
      const { customer_id, items, total_amount, payment_method, sale_date } = saleData;
      
      db.getDb().serialize(() => {
        db.getDb().run('BEGIN TRANSACTION');
        
        // Insert sale
        db.getDb().run(
          `INSERT INTO sales (customer_id, total_amount, payment_method, sale_date) VALUES (?, ?, ?, ?)`,
          [customer_id, total_amount, payment_method, sale_date],
          function(err) {
            if (err) {
              db.getDb().run('ROLLBACK');
              reject(err);
              return;
            }
            
            const saleId = this.lastID;
            
            // Insert sale items
            let completed = 0;
            const totalItems = items.length;
            
            if (totalItems === 0) {
              db.getDb().run('COMMIT');
              resolve({ id: saleId, ...saleData });
              return;
            }
            
            items.forEach(async (item) => {
              db.getDb().run(
                `INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal) 
                 VALUES (?, ?, ?, ?, ?)`,
                [saleId, item.product_id, item.quantity, item.price, item.subtotal],
                async (err) => {
                  if (err) {
                    db.getDb().run('ROLLBACK');
                    reject(err);
                    return;
                  }
                  
                  // Update product stock
                  try {
                    await Product.updateStock(item.product_id, item.quantity, 'out', 'sale', saleId, { useTransaction: false });
                  } catch (stockErr) {
                    db.getDb().run('ROLLBACK');
                    reject(stockErr);
                    return;
                  }
                  
                  completed++;
                  if (completed === totalItems) {
                    db.getDb().run('COMMIT');
                    resolve({ id: saleId, ...saleData });
                  }
                }
              );
            });
          }
        );
      });
    });
  }

  static findAll() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT s.*, c.name as customer_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        ORDER BY s.sale_date DESC
      `;
      
      db.getDb().all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.id = ?
      `;
      
      db.getDb().get(sql, [id], (err, sale) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!sale) {
          resolve(null);
          return;
        }
        
        // Get sale items
        db.getDb().all(
          `SELECT si.*, pr.name as product_name, pr.brand, pr.model
           FROM sale_items si
           LEFT JOIN products pr ON si.product_id = pr.id
           WHERE si.sale_id = ?`,
          [id],
          (err, items) => {
            if (err) {
              reject(err);
            } else {
              resolve({ ...sale, items });
            }
          }
        );
      });
    });
  }

  static getTodaySales() {
    return new Promise((resolve, reject) => {
      db.getDb().get(
        `SELECT SUM(total_amount) as total FROM sales WHERE DATE(sale_date) = DATE('now')`,
        [],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? row.total || 0 : 0);
          }
        }
      );
    });
  }

  static getMonthlySales() {
    return new Promise((resolve, reject) => {
      db.getDb().get(
        `SELECT SUM(total_amount) as total FROM sales WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', 'now')`,
        [],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? row.total || 0 : 0);
          }
        }
      );
    });
  }

  static getRecent(limit = 10) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT s.*, c.name as customer_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        ORDER BY s.created_at DESC
        LIMIT ?
      `;
      
      db.getDb().all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static getSalesByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT s.*, c.name as customer_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.sale_date BETWEEN ? AND ?
        ORDER BY s.sale_date DESC
      `;
      
      db.getDb().all(sql, [startDate, endDate], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = Sale;
