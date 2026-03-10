const db = require('../database/db');

class Supplier {
  static create(supplierData) {
    return new Promise((resolve, reject) => {
      const { name, company, phone, email, address } = supplierData;
      
      db.getDb().run(
        `INSERT INTO suppliers (name, company, phone, email, address) VALUES (?, ?, ?, ?, ?)`,
        [name, company, phone, email, address],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...supplierData });
          }
        }
      );
    });
  }

  static findAll() {
    return new Promise((resolve, reject) => {
      db.getDb().all(
        `SELECT * FROM suppliers ORDER BY name`,
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

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.getDb().get(
        `SELECT * FROM suppliers WHERE id = ?`,
        [id],
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

  static update(id, supplierData) {
    return new Promise((resolve, reject) => {
      const { name, company, phone, email, address } = supplierData;
      
      db.getDb().run(
        `UPDATE suppliers SET name = ?, company = ?, phone = ?, email = ?, address = ? WHERE id = ?`,
        [name, company, phone, email, address, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, ...supplierData });
          }
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.getDb().run(
        `DELETE FROM suppliers WHERE id = ?`,
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

  static getPurchaseHistory(supplierId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, pi.product_id, pr.name as product_name, pi.quantity, pi.price, pi.subtotal
        FROM purchases p
        LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
        LEFT JOIN products pr ON pi.product_id = pr.id
        WHERE p.supplier_id = ?
        ORDER BY p.purchase_date DESC
      `;
      
      db.getDb().all(sql, [supplierId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = Supplier;