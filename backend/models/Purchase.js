const db = require('../database/db');
const Product = require('./Product');

class Purchase {
  static create(purchaseData) {
    return new Promise(async (resolve, reject) => {
      const { supplier_id, items, total_amount, purchase_date } = purchaseData;
      
      db.getDb().serialize(() => {
        db.getDb().run('BEGIN TRANSACTION');
        
        // Insert purchase
        db.getDb().run(
          `INSERT INTO purchases (supplier_id, total_amount, purchase_date) VALUES (?, ?, ?)`,
          [supplier_id, total_amount, purchase_date],
          function(err) {
            if (err) {
              db.getDb().run('ROLLBACK');
              reject(err);
              return;
            }
            
            const purchaseId = this.lastID;
            
            // Insert purchase items
            let completed = 0;
            const totalItems = items.length;
            
            if (totalItems === 0) {
              db.getDb().run('COMMIT');
              resolve({ id: purchaseId, ...purchaseData });
              return;
            }
            
            items.forEach(async (item) => {
              db.getDb().run(
                `INSERT INTO purchase_items (purchase_id, product_id, quantity, price, subtotal) 
                 VALUES (?, ?, ?, ?, ?)`,
                [purchaseId, item.product_id, item.quantity, item.price, item.subtotal],
                async (err) => {
                  if (err) {
                    db.getDb().run('ROLLBACK');
                    reject(err);
                    return;
                  }
                  
                  // Update product stock
                  try {
                    await Product.updateStock(item.product_id, item.quantity, 'in', 'purchase', purchaseId, { useTransaction: false });
                  } catch (stockErr) {
                    db.getDb().run('ROLLBACK');
                    reject(stockErr);
                    return;
                  }
                  
                  completed++;
                  if (completed === totalItems) {
                    db.getDb().run('COMMIT');
                    resolve({ id: purchaseId, ...purchaseData });
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
        SELECT p.*, s.name as supplier_name, s.company as supplier_company
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY p.purchase_date DESC
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
        SELECT p.*, s.name as supplier_name, s.company as supplier_company
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ?
      `;
      
      db.getDb().get(sql, [id], (err, purchase) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!purchase) {
          resolve(null);
          return;
        }
        
        // Get purchase items
        db.getDb().all(
          `SELECT pi.*, pr.name as product_name, pr.brand, pr.model
           FROM purchase_items pi
           LEFT JOIN products pr ON pi.product_id = pr.id
           WHERE pi.purchase_id = ?`,
          [id],
          (err, items) => {
            if (err) {
              reject(err);
            } else {
              resolve({ ...purchase, items });
            }
          }
        );
      });
    });
  }

  static getRecent(limit = 10) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, s.name as supplier_name
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY p.created_at DESC
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
}

module.exports = Purchase;
