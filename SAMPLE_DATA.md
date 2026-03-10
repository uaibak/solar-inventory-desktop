# Solar Inventory Database - Sample Data

This document describes the comprehensive sample data that has been added to the Solar Inventory Management System database for testing all functionality.

## Sample Data Overview

The database now includes realistic sample data across all tables to enable thorough testing of every feature in the application.

### 🔐 Default Admin User
- **Email**: admin@solarinventory.com
- **Password**: admin123
- **Role**: admin

### 📂 Categories (7 categories)
1. **Solar Panels** - Solar photovoltaic panels for energy generation
2. **Inverters** - Power inverters for solar systems
3. **Batteries** - Solar battery storage systems
4. **Accessories** - Solar system accessories and components
5. **Mounting Structures** - Roof and ground mounting structures
6. **Cables & Wiring** - Electrical cables and wiring components
7. **Charge Controllers** - Solar charge controllers and regulators

### 🏢 Suppliers (5 suppliers)
1. **SolarTech Solutions** - Lahore, Pakistan
2. **Green Energy Ltd** - Karachi, Pakistan
3. **PowerMax Distributors** - Islamabad, Pakistan
4. **SunPower Pakistan** - Faisalabad, Pakistan
5. **EcoVolt Systems** - Rawalpindi, Pakistan

### 👥 Customers (8 customers)
1. **Ahmed Khan** - DHA Phase 1, Lahore
2. **Fatima Ahmed** - Gulberg, Karachi
3. **Muhammad Ali** - F-7, Islamabad
4. **Ayesha Malik** - Johar Town, Lahore
5. **Hassan Raza** - I-10, Islamabad
6. **Zara Khan** - Bahria Town, Karachi
7. **Omar Farooq** - Blue Area, Islamabad
8. **Maryam Shah** - Gulshan-e-Iqbal, Karachi

### 📦 Products (15 products)
1. **Solar Panel 400W** - SunPower (Stock: 50)
2. **Solar Panel 500W** - Canadian Solar (Stock: 75)
3. **Solar Panel 600W** - Jinko Solar (Stock: 30)
4. **Hybrid Inverter 5KW** - Growatt (Stock: 20)
5. **String Inverter 10KW** - SMA (Stock: 12)
6. **Lithium Battery 5KWh** - BYD (Stock: 25)
7. **Solar Battery 10KWh** - Tesla (Stock: 15)
8. **Solar Cable 4mm** - Generic (Stock: 500)
9. **MC4 Connectors** - Generic (Stock: 200)
10. **Charge Controller 60A** - Victron (Stock: 18)
11. **Mounting Kit Complete** - Generic (Stock: 40)
12. **Solar Panel 300W** - Trina Solar (Stock: 60)
13. **Off-Grid Inverter 3KW** - Must (Stock: 22)
14. **Solar Battery 2.5KWh** - LG (Stock: 35)
15. **Solar Cable 6mm** - Generic (Stock: 300)

### 🛒 Sales Transactions (10 sales)
- **Total Sales**: PKR 1,237,000
- **Date Range**: January 15-24, 2024
- **Payment Methods**: Cash, Card, Bank Transfer
- **Customers**: Mix of registered customers and walk-ins

### 📥 Purchase Transactions (8 purchases)
- **Total Purchases**: PKR 1,250,000
- **Date Range**: January 7-14, 2024
- **Suppliers**: All 5 suppliers represented

### 💰 Expenses (10 expense entries)
- **Total Expenses**: PKR 190,000
- **Categories**: Rent, Utilities, Marketing, Supplies, etc.
- **Date Range**: January 1-25, 2024

## Testing Scenarios Available

### Dashboard Testing
- View comprehensive metrics and statistics
- Recent sales and purchases activity
- Top products analysis
- Financial summaries

### Inventory Management
- Product catalog browsing and filtering
- Stock level monitoring (with low stock alerts)
- Category-based organization
- Supplier relationship tracking

### Sales Management
- Complete sales transaction history
- Customer purchase patterns
- Payment method analysis
- Product performance tracking

### Purchase Management
- Supplier purchase history
- Inventory replenishment tracking
- Cost analysis and trends

### Reporting
- Sales reports with date filtering
- Purchase reports by supplier
- Inventory status reports
- Financial summaries and profit analysis

### Customer Management
- Customer database with contact information
- Purchase history per customer
- Customer segmentation analysis

## API Endpoints for Testing

All CRUD operations can be tested with the sample data:

- `GET /api/products` - Browse all products
- `GET /api/sales` - View sales transactions
- `GET /api/purchases` - View purchase transactions
- `GET /api/customers` - Browse customers
- `GET /api/suppliers` - Browse suppliers
- `GET /api/categories` - Browse categories
- `GET /api/reports/sales` - Generate sales reports
- `GET /api/reports/purchases` - Generate purchase reports
- `GET /api/reports/inventory` - Generate inventory reports
- `GET /api/reports/financial` - Generate financial reports

## Database Management

### Reset Database (Admin Only)
```bash
POST /api/database/clean
```
Clears all data except admin user and restores default sample data.

### Reseed Database (Admin Only)
```bash
POST /api/database/seed
```
Adds sample data to existing database (use with caution).

## Data Relationships

The sample data maintains proper referential integrity:
- Products link to categories and suppliers
- Sales link to customers and contain sale items
- Purchases link to suppliers and contain purchase items
- All financial calculations are accurate
- Stock levels reflect actual transactions

## Business Logic Testing

The sample data enables testing of:
- **Stock Management**: Low stock alerts, inventory tracking
- **Financial Reporting**: Profit margins, revenue analysis
- **Customer Insights**: Purchase patterns, customer value
- **Supplier Performance**: Purchase volumes, reliability
- **Product Performance**: Sales velocity, profitability

This comprehensive dataset ensures that every feature of the Solar Inventory Management System can be thoroughly tested with realistic, interconnected data.</content>
<parameter name="filePath">D:\Work\solar-inventory-desktop\SAMPLE_DATA.md