const db = require('../database/db');
const bcrypt = require('bcryptjs');

class User {
  static create(userData) {
    return new Promise((resolve, reject) => {
      const { name, email, password, role = 'staff' } = userData;
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      db.getDb().run(
        `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
        [name, email, hashedPassword, role],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...userData, role });
          }
        }
      );
    });
  }

  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.getDb().get(
        `SELECT * FROM users WHERE email = ?`,
        [email],
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

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.getDb().get(
        `SELECT id, name, email, role, created_at FROM users WHERE id = ?`,
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

  static findAll() {
    return new Promise((resolve, reject) => {
      db.getDb().all(
        `SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`,
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

  static countUsers() {
    return new Promise((resolve, reject) => {
      db.getDb().get(
        `SELECT COUNT(*) as count FROM users`,
        [],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row?.count || 0);
          }
        }
      );
    });
  }

  static update(id, userData) {
    return new Promise((resolve, reject) => {
      const { name, email, role } = userData;
      let sql = `UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?`;
      let params = [name, email, role, id];

      if (userData.password) {
        const hashedPassword = bcrypt.hashSync(userData.password, 10);
        sql = `UPDATE users SET name = ?, email = ?, password_hash = ?, role = ? WHERE id = ?`;
        params = [name, email, hashedPassword, role, id];
      }

      db.getDb().run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...userData });
        }
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.getDb().run(
        `DELETE FROM users WHERE id = ?`,
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

  static verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }
}

module.exports = User;
