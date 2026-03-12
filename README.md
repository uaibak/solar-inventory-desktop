# Solar Inventory Desktop

A full-stack desktop inventory management system for a solar equipment store. It tracks products, categories, suppliers, customers, purchases, and sales with a modern React UI, local SQLite storage, and a bundled Electron shell.

## What This System Does
- Manage inventory items and categories
- Track purchases and supplier spend
- Track sales, customers, and revenue
- Generate reports with filters and CSV export
- View dashboard KPIs with recent activity and top lists
- Generate invoice PDF from sales (Electron)

## Key Features
- Desktop app (Electron) + local API (Express)
- Local SQLite database with auto-create and seed
- JWT authentication with role-based access
- Dashboard summary with:
  - Total products, sales, revenue, low stock
  - Recent sales and purchases
  - Top products (by revenue + units sold)
  - Top customers (by sales revenue)
  - Top suppliers (by purchase spend)
- Reports with search, date filters, pagination, and export
- CSV export uses ISO dates to parse cleanly in Excel
- Invoice view and PDF download (Electron only)

## Tech Stack
- Frontend: React 18, React Router, TailwindCSS, Chart.js
- Backend: Node.js, Express, SQLite3
- Desktop: Electron 25

## Project Structure
```
solar-inventory-desktop/
|-- electron/           # Electron main + preload
|-- frontend/           # React app
|   |-- src/
|       |-- components/ # Reusable UI
|       |-- pages/      # Screens
|       |-- layouts/    # Layout shell
|-- backend/            # Express API
|   |-- routes/         # API routes
|   |-- models/         # Data access
|   |-- database/       # SQLite setup + seed
|-- data/               # Dev database (created at runtime)
|-- package.json
```

## Prerequisites
- Node.js 18+ recommended
- npm

## Install
From repo root:
```bash
npm install

cd frontend
npm install
cd ..

cd backend
npm install
cd ..
```

## Run (Development)
```bash
npm run dev
```
This starts:
- Backend API: `http://localhost:3001`
- Frontend UI: `http://localhost:3000`
- Electron app (loads the frontend dev server)

## Run (Production)
```bash
npm start
```
Runs Electron directly. In production, build the frontend first.

## Build & Package
```bash
npm run build:frontend
npm run build:electron
```
Or all-in-one:
```bash
npm run dist
```
Output goes to `dist/`.

## Default Login
- Email: `admin@solarinventory.com`
- Password: `admin123`

## Database
- Dev DB file: `data/inventory.db`
- Production DB file: Electron userData directory (OS-specific)

The database is auto-created on first run. In packaged (dist) builds, no users or sample data are seeded, so the app starts with an empty database and prompts for admin registration.
Set SEED_SAMPLE_DATA=true to enable sample data seeding if you want it.

## API Overview
Base URL: `http://localhost:3001/api`

Auth:
- `POST /auth/login`
- `GET /auth/profile`
- `POST /auth/change-password`

CRUD:
- `/users` (admin only)
- `/categories`
- `/suppliers`
- `/customers`
- `/products`
- `/purchases`
- `/sales`

Dashboard:
- `GET /dashboard`

Reports:
- `GET /reports?type=...&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- `GET /reports/list?type=...&page=1&pageSize=10&search=&dateFrom=&dateTo=&category=&supplier=`

Report Types:
- `daily_sales`
- `monthly_sales`
- `inventory_stock`
- `low_stock`
- `purchase_history`
- `profit_report`

Database tools (admin only):
- `POST /database/clean`
- `POST /database/seed`

## Sample Data
See `SAMPLE_DATA.md` for example CSV and datasets used for testing.

## PDF Invoices
Invoice PDF download uses Electron’s `printToPDF` API. It will not work in a plain browser tab. Use the Electron app for PDF export.

## Performance Notes
- SQLite is configured with WAL mode and indexes for dashboard and reports.
- Reports list is server-side paginated for fast filtering and export.

## Troubleshooting
- Port conflicts: ensure `3000` and `3001` are free.
- If the DB is corrupted, delete `data/inventory.db` and restart.
- PDF export requires Electron; browser mode won’t download.

## License
Boost Software License 1.0. See `LICENSE`.