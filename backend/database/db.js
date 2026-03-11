const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    const userDataPath = process.env.NODE_ENV === 'production' 
      ? require('electron').app.getPath('userData')
      : path.join(__dirname, '../../data');
    
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    const dbPath = path.join(userDataPath, 'inventory.db');
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database.');
        this.applyPragmas();
        this.createTables();
      }
    });
  }

  applyPragmas() {
    // Pragmas for better performance on local desktop workloads
    this.db.serialize(() => {
      this.db.run('PRAGMA foreign_keys = ON');
      this.db.run('PRAGMA journal_mode = WAL');
      this.db.run('PRAGMA synchronous = NORMAL');
      this.db.run('PRAGMA temp_store = MEMORY');
    });
  }

  createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        company TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        watt_capacity INTEGER,
        category_id INTEGER,
        supplier_id INTEGER,
        barcode TEXT,
        purchase_price REAL,
        sale_price REAL,
        stock_quantity INTEGER DEFAULT 0,
        minimum_stock INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        purchase_date DATE DEFAULT CURRENT_DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS purchase_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (purchase_id) REFERENCES purchases (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        total_amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        sale_date DATE DEFAULT CURRENT_DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        movement_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        reference_type TEXT,
        reference_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    let completed = 0;
    const total = tables.length;
    tables.forEach(sql => {
      this.db.run(sql, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
        }
        completed++;
        if (completed === total) {
          this.createIndexes(() => {
            this.seedInitialData();
          });
        }
      });
    });
  }

  createIndexes(callback) {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)',
      'CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id)',
      'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',
      'CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date)',
      'CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date)',
      'CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id)',
      'CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)',
      'CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id)'
    ];

    let completed = 0;
    const total = indexes.length;
    indexes.forEach(sql => {
      this.db.run(sql, (err) => {
        if (err) {
          console.error('Error creating index:', err.message);
        }
        completed++;
        if (completed === total) {
          callback();
        }
      });
    });
  }

  seedInitialData() {
    // Create default admin user (only if no users exist)
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    // Check if admin user already exists
    this.db.get('SELECT COUNT(*) as count FROM users WHERE email = ?', ['admin@solarinventory.com'], (err, row) => {
      if (!err && row.count === 0) {
        this.db.run(
          `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
          ['Admin User', 'admin@solarinventory.com', hashedPassword, 'admin']
        );
      }
    });

    // Create default categories (only if no categories exist)
    this.db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
      if (!err && row.count === 0) {
        const categories = [
          ['Solar Panels', 'Solar photovoltaic panels for energy generation'],
          ['Inverters', 'Power inverters for solar systems'],
          ['Batteries', 'Solar battery storage systems'],
          ['Accessories', 'Solar system accessories and components'],
          ['Mounting Structures', 'Roof and ground mounting structures'],
          ['Cables & Wiring', 'Electrical cables and wiring components'],
          ['Charge Controllers', 'Solar charge controllers and regulators']
        ];

        categories.forEach(([name, description]) => {
          this.db.run(
            `INSERT INTO categories (name, description) VALUES (?, ?)`,
            [name, description]
          );
        });
      }
    });

    // Create sample suppliers (only if no suppliers exist)
    this.db.get('SELECT COUNT(*) as count FROM suppliers', (err, row) => {
      if (!err && row.count === 0) {
        const suppliers = [
          ['SolarTech Solutions', 'SolarTech Corp', '+92-300-1234567', 'contact@solartech.pk', '123 Industrial Area, Lahore, Pakistan'],
          ['Green Energy Ltd', 'Green Energy', '+92-321-9876543', 'sales@greenenergy.pk', '456 Commercial Street, Karachi, Pakistan'],
          ['PowerMax Distributors', 'PowerMax Inc', '+92-333-5556666', 'info@powermax.pk', '789 Business Avenue, Islamabad, Pakistan'],
          ['SunPower Pakistan', 'SunPower Global', '+92-344-7778888', 'support@sunpower.pk', '321 Solar Road, Faisalabad, Pakistan'],
          ['EcoVolt Systems', 'EcoVolt Ltd', '+92-355-9990000', 'orders@ecovolt.pk', '654 Renewable Street, Rawalpindi, Pakistan']
        ];

        suppliers.forEach(([name, company, phone, email, address]) => {
          this.db.run(
            `INSERT INTO suppliers (name, company, phone, email, address) VALUES (?, ?, ?, ?, ?)`,
            [name, company, phone, email, address]
          );
        });
      }
    });

    // Create sample customers (only if no customers exist)
    this.db.get('SELECT COUNT(*) as count FROM customers', (err, row) => {
      if (!err && row.count === 0) {
        const customers = [
          ['Ahmed Khan', '+92-300-1112222', 'ahmed.khan@email.com', 'House 123, DHA Phase 1, Lahore'],
          ['Fatima Ahmed', '+92-321-3334444', 'fatima.ahmed@email.com', 'Apartment 45, Gulberg, Karachi'],
          ['Muhammad Ali', '+92-333-5556666', 'muhammad.ali@email.com', 'Villa 78, F-7, Islamabad'],
          ['Ayesha Malik', '+92-344-7778888', 'ayesha.malik@email.com', 'Plot 56, Johar Town, Lahore'],
          ['Hassan Raza', '+92-355-9990000', 'hassan.raza@email.com', 'Office 12, I-10, Islamabad'],
          ['Zara Khan', '+92-366-1112222', 'zara.khan@email.com', 'House 89, Bahria Town, Karachi'],
          ['Omar Farooq', '+92-377-3334444', 'omar.farooq@email.com', 'Suite 34, Blue Area, Islamabad'],
          ['Maryam Shah', '+92-388-5556666', 'maryam.shah@email.com', 'Apartment 67, Gulshan-e-Iqbal, Karachi']
        ];

        customers.forEach(([name, phone, email, address]) => {
          this.db.run(
            `INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)`,
            [name, phone, email, address]
          );
        });
      }
    });

    // Create sample products (only if no products exist)
    this.db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
      if (!err && row.count === 0) {
        const products = [
          ['Solar Panel 400W', 'SunPower', 'SP400', 400, 1, 4, 'SP400-001', 25000, 32000, 50, 10],
          ['Solar Panel 500W', 'Canadian Solar', 'CS500', 500, 1, 1, 'CS500-002', 30000, 38000, 75, 15],
          ['Solar Panel 600W', 'Jinko Solar', 'JK600', 600, 1, 2, 'JK600-003', 35000, 45000, 30, 8],
          ['Hybrid Inverter 5KW', 'Growatt', 'GROWATT-5K', 5000, 2, 3, 'INV5K-004', 75000, 95000, 20, 5],
          ['String Inverter 10KW', 'SMA', 'SMA10K', 10000, 2, 5, 'SMA10K-005', 150000, 185000, 12, 3],
          ['Lithium Battery 5KWh', 'BYD', 'BYD5K', 5000, 3, 1, 'BAT5K-006', 120000, 150000, 25, 6],
          ['Solar Battery 10KWh', 'Tesla', 'TESLA10K', 10000, 3, 4, 'TESLA10K-007', 220000, 280000, 15, 4],
          ['Solar Cable 4mm', 'Generic', 'CABLE4MM', null, 6, 2, 'CABLE4-008', 150, 200, 500, 50],
          ['MC4 Connectors', 'Generic', 'MC4-SET', null, 4, 3, 'MC4-009', 50, 75, 200, 25],
          ['Charge Controller 60A', 'Victron', 'VICTRON60', null, 7, 5, 'CC60-010', 15000, 18500, 18, 4],
          ['Mounting Kit Complete', 'Generic', 'MOUNT-KIT', null, 5, 1, 'MOUNT-011', 8000, 12000, 40, 8],
          ['Solar Panel 300W', 'Trina Solar', 'TRINA300', 300, 1, 2, 'TRINA300-012', 18000, 24000, 60, 12],
          ['Off-Grid Inverter 3KW', 'Must', 'MUST3K', 3000, 2, 3, 'OFFGRID3K-013', 45000, 58000, 22, 5],
          ['Solar Battery 2.5KWh', 'LG', 'LG2.5K', 2500, 3, 4, 'LG2.5K-014', 65000, 85000, 35, 7],
          ['Solar Cable 6mm', 'Generic', 'CABLE6MM', null, 6, 2, 'CABLE6-015', 220, 300, 300, 30]
        ];

        products.forEach(([name, brand, model, watt_capacity, category_id, supplier_id, barcode, purchase_price, sale_price, stock_quantity, minimum_stock]) => {
          this.db.run(
            `INSERT INTO products (name, brand, model, watt_capacity, category_id, supplier_id, barcode, purchase_price, sale_price, stock_quantity, minimum_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, brand, model, watt_capacity, category_id, supplier_id, barcode, purchase_price, sale_price, stock_quantity, minimum_stock]
          );
        });
      }
    });

    // Create sample sales (only if no sales exist)
    this.db.get('SELECT COUNT(*) as count FROM sales', (err, row) => {
      if (!err && row.count === 0) {
        const sales = [
          [1, 152000, 'cash', '2024-01-15'],
          [2, 285000, 'card', '2024-01-16'],
          [null, 95000, 'cash', '2024-01-17'],
          [3, 78000, 'bank_transfer', '2024-01-18'],
          [4, 320000, 'cash', '2024-01-19'],
          [5, 185000, 'card', '2024-01-20'],
          [null, 24000, 'cash', '2024-01-21'],
          [6, 150000, 'bank_transfer', '2024-01-22'],
          [7, 58000, 'cash', '2024-01-23'],
          [8, 45000, 'card', '2024-01-24']
        ];

        sales.forEach(([customer_id, total_amount, payment_method, sale_date]) => {
          this.db.run(
            `INSERT INTO sales (customer_id, total_amount, payment_method, sale_date) VALUES (?, ?, ?, ?)`,
            [customer_id, total_amount, payment_method, sale_date]
          );
        });
      }
    });

    // Create sample sale items (only if no sale items exist)
    this.db.get('SELECT COUNT(*) as count FROM sale_items', (err, row) => {
      if (!err && row.count === 0) {
        const saleItems = [
          [1, 1, 2, 32000, 64000],
          [1, 8, 10, 200, 2000],
          [2, 2, 3, 38000, 114000],
          [2, 4, 1, 95000, 95000],
          [2, 9, 5, 75, 375],
          [3, 3, 1, 45000, 45000],
          [3, 10, 2, 18500, 37000],
          [4, 12, 2, 24000, 48000],
          [4, 8, 8, 200, 1600],
          [5, 1, 5, 32000, 160000],
          [5, 2, 2, 38000, 76000],
          [5, 6, 1, 150000, 150000],
          [6, 5, 1, 185000, 185000],
          [7, 8, 12, 200, 2400],
          [7, 9, 8, 75, 600],
          [8, 7, 1, 280000, 280000],
          [9, 13, 1, 58000, 58000],
          [10, 14, 1, 85000, 85000]
        ];

        saleItems.forEach(([sale_id, product_id, quantity, price, subtotal]) => {
          this.db.run(
            `INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)`,
            [sale_id, product_id, quantity, price, subtotal]
          );
        });
      }
    });

    // Create sample purchases (only if no purchases exist)
    this.db.get('SELECT COUNT(*) as count FROM purchases', (err, row) => {
      if (!err && row.count === 0) {
        const purchases = [
          [1, 125000, '2024-01-10'],
          [2, 285000, '2024-01-11'],
          [3, 95000, '2024-01-12'],
          [4, 180000, '2024-01-13'],
          [5, 320000, '2024-01-14'],
          [1, 75000, '2024-01-08'],
          [2, 150000, '2024-01-09'],
          [3, 220000, '2024-01-07']
        ];

        purchases.forEach(([supplier_id, total_amount, purchase_date]) => {
          this.db.run(
            `INSERT INTO purchases (supplier_id, total_amount, purchase_date) VALUES (?, ?, ?)`,
            [supplier_id, total_amount, purchase_date]
          );
        });
      }
    });

    // Create sample purchase items (only if no purchase items exist)
    this.db.get('SELECT COUNT(*) as count FROM purchase_items', (err, row) => {
      if (!err && row.count === 0) {
        const purchaseItems = [
          [1, 1, 5, 25000, 125000],
          [2, 2, 8, 30000, 240000],
          [2, 8, 50, 150, 7500],
          [2, 9, 25, 50, 1250],
          [3, 4, 2, 75000, 150000],
          [3, 10, 4, 15000, 60000],
          [3, 11, 8, 8000, 64000],
          [4, 3, 4, 35000, 140000],
          [4, 12, 10, 18000, 180000],
          [5, 5, 2, 150000, 300000],
          [5, 6, 1, 120000, 120000],
          [5, 7, 1, 220000, 220000],
          [6, 13, 3, 45000, 135000],
          [6, 14, 2, 65000, 130000],
          [7, 1, 3, 25000, 75000],
          [7, 15, 20, 220, 4400],
          [8, 2, 5, 30000, 150000],
          [8, 4, 1, 75000, 75000]
        ];

        purchaseItems.forEach(([purchase_id, product_id, quantity, price, subtotal]) => {
          this.db.run(
            `INSERT INTO purchase_items (purchase_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)`,
            [purchase_id, product_id, quantity, price, subtotal]
          );
        });
      }
    });

    // Create sample expenses (only if no expenses exist)
    this.db.get('SELECT COUNT(*) as count FROM expenses', (err, row) => {
      if (!err && row.count === 0) {
        const expenses = [
          ['Office Rent', 50000, '2024-01-01', 'Monthly office rent payment'],
          ['Electricity Bill', 15000, '2024-01-05', 'Office electricity charges'],
          ['Internet & Phone', 8000, '2024-01-07', 'Monthly internet and phone bills'],
          ['Transportation', 12000, '2024-01-10', 'Fuel and vehicle maintenance'],
          ['Marketing Materials', 25000, '2024-01-12', 'Brochures and promotional materials'],
          ['Office Supplies', 5000, '2024-01-15', 'Stationery and office supplies'],
          ['Software Licenses', 30000, '2024-01-18', 'Annual software subscriptions'],
          ['Insurance Premium', 20000, '2024-01-20', 'Business insurance payment'],
          ['Staff Training', 15000, '2024-01-22', 'Employee training workshop'],
          ['Equipment Maintenance', 8000, '2024-01-25', 'Solar equipment maintenance']
        ];

        expenses.forEach(([title, amount, date, notes]) => {
          this.db.run(
            `INSERT INTO expenses (title, amount, date, notes) VALUES (?, ?, ?, ?)`,
            [title, amount, date, notes]
          );
        });
      }
    });
  }

  // Method to clean/reset the database
  cleanDatabase() {
    return new Promise((resolve, reject) => {
      const tables = [
        'expenses',
        'stock_movements', 
        'sale_items',
        'sales',
        'purchase_items',
        'purchases',
        'products',
        'customers',
        'suppliers',
        'categories'
        // Keep users table - don't delete admin user
      ];

      let completed = 0;
      const total = tables.length;

      tables.forEach(table => {
        this.db.run(`DELETE FROM ${table}`, (err) => {
          if (err) {
            console.error(`Error clearing table ${table}:`, err.message);
          }
          completed++;
          if (completed === total) {
            console.log('Database cleaned successfully');
            // Re-seed with default data
            this.seedInitialData();
            resolve();
          }
        });
      });
    });
  }

  getDb() {
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new Database();
