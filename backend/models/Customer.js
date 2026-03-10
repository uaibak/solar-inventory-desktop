const db = require('../database/db');

class Customer {
  static create(customerData) {
    return new Promise((resolve, reject) => {
      const { name, phone, email, address } = customerData;
      
      db.getDb().run(
        `INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)`,
        [name, phone, email, address],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...customerData });
          }
        }
      );
    });
  }

  static findAll() {
    return new Promise((resolve, reject) => {
      db.getDb().all(
        `SELECT * FROM customers ORDER BY name`,
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
        `SELECT * FROM customers WHERE id = ?`,
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

  static update(id, customerData) {
    return new Promise((resolve, reject) => {
      const { name, phone, email, address } = customerData;
      
      db.getDb().run(
        `UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?`,
        [name, phone, email, address, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, ...customerData });
          }
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.getDb().run(
        `DELETE FROM customers WHERE id = ?`,
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

  static search(query) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM customers 
        WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
        ORDER BY name
      `;
      const searchTerm = `%${query}%`;
      
      db.getDb().all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = Customer;