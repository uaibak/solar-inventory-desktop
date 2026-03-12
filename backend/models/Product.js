const db = require('../database/db');

class Product {
  static create(productData) {
    return new Promise((resolve, reject) => {
      const { 
        name, brand, model, watt_capacity, category_id, supplier_id, 
        barcode, purchase_price, sale_price, stock_quantity = 0, minimum_stock = 0 
      } = productData;
      
      db.getDb().run(
        `INSERT INTO products (name, brand, model, watt_capacity, category_id, supplier_id, barcode, purchase_price, sale_price, stock_quantity, minimum_stock) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, brand, model, watt_capacity, category_id, supplier_id, barcode, purchase_price, sale_price, stock_quantity, minimum_stock],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...productData });
          }
        }
      );
    });
  }

  static findAll(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT p.*, c.name as category_name, s.name as supplier_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
      `;
      
      const params = [];
      const conditions = [];
      
      if (filters.category_id) {
        conditions.push('p.category_id = ?');
        params.push(filters.category_id);
      }
      
      if (filters.supplier_id) {
        conditions.push('p.supplier_id = ?');
        params.push(filters.supplier_id);
      }
      
      if (filters.search) {
        conditions.push('(p.name LIKE ? OR p.brand LIKE ? OR p.model LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      
      sql += ' ORDER BY p.name';
      
      db.getDb().all(sql, params, (err, rows) => {
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
        SELECT p.*, c.name as category_name, s.name as supplier_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ?
      `;
      
      db.getDb().get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static update(id, productData) {
    return new Promise((resolve, reject) => {
      const { 
        name, brand, model, watt_capacity, category_id, supplier_id, 
        barcode, purchase_price, sale_price, stock_quantity, minimum_stock 
      } = productData;
      
      db.getDb().run(
        `UPDATE products SET 
         name = ?, brand = ?, model = ?, watt_capacity = ?, category_id = ?, supplier_id = ?, 
         barcode = ?, purchase_price = ?, sale_price = ?, stock_quantity = ?, minimum_stock = ? 
         WHERE id = ?`,
        [name, brand, model, watt_capacity, category_id, supplier_id, barcode, purchase_price, sale_price, stock_quantity, minimum_stock, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, ...productData });
          }
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.getDb().run(
        `DELETE FROM products WHERE id = ?`,
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ deleted: this.changes > 0 });
          }
        }
      );
    });
  }

  static updateStock(id, quantity, movementType, referenceType = null, referenceId = null, options = {}) {
    return new Promise((resolve, reject) => {
      const useTransaction = options.useTransaction !== false;
      const runUpdate = () => {
        const sql = movementType === 'in' 
          ? `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`
          : `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`;

        db.getDb().run(sql, [quantity, id], (err) => {
          if (err) {
            if (useTransaction) {
              db.getDb().run('ROLLBACK');
            }
            reject(err);
            return;
          }

          db.getDb().run(
            `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [id, movementType, quantity, referenceType, referenceId],
            (err) => {
              if (err) {
                if (useTransaction) {
                  db.getDb().run('ROLLBACK');
                }
                reject(err);
              } else {
                if (useTransaction) {
                  db.getDb().run('COMMIT');
                }
                resolve();
              }
            }
          );
        });
      };

      if (useTransaction) {
        db.getDb().serialize(() => {
          db.getDb().run('BEGIN TRANSACTION');
          runUpdate();
        });
      } else {
        runUpdate();
      }
    });
  }

  static getLowStock() {
    return new Promise((resolve, reject) => {
      db.getDb().all(
        `SELECT * FROM products WHERE stock_quantity <= minimum_stock ORDER BY stock_quantity ASC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  static getInventoryValue() {
    return new Promise((resolve, reject) => {
      db.getDb().get(
        `SELECT 
         SUM(stock_quantity * purchase_price) as total_purchase_value,
         SUM(stock_quantity * sale_price) as total_sale_value
         FROM products`,
        [],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }
}

module.exports = Product;
