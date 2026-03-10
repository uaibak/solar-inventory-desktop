const db = require('../database/db');

class Category {
  static create(categoryData) {
    return new Promise((resolve, reject) => {
      const { name, description } = categoryData;
      
      db.getDb().run(
        `INSERT INTO categories (name, description) VALUES (?, ?)`,
        [name, description],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...categoryData });
          }
        }
      );
    });
  }

  static findAll() {
    return new Promise((resolve, reject) => {
      db.getDb().all(
        `SELECT * FROM categories ORDER BY name`,
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
        `SELECT * FROM categories WHERE id = ?`,
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

  static update(id, categoryData) {
    return new Promise((resolve, reject) => {
      const { name, description } = categoryData;
      
      db.getDb().run(
        `UPDATE categories SET name = ?, description = ? WHERE id = ?`,
        [name, description, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, ...categoryData });
          }
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.getDb().run(
        `DELETE FROM categories WHERE id = ?`,
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
}

module.exports = Category;