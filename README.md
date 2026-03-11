# Solar Inventory Desktop

Desktop inventory management system for solar equipment with a React frontend, Express + SQLite backend, and Electron shell.

## Highlights
- Electron desktop app with React UI
- Express API with SQLite storage
- Role-based auth (JWT)
- Inventory, sales, purchases, suppliers, customers, categories
- Reports with CSV/JSON export
- Dashboard + reports optimized endpoints
- Invoice view with PDF download (Electron)
- Seeded sample data for quick testing

## Tech Stack
- Frontend: React, TailwindCSS
- Backend: Node.js, Express
- Database: SQLite (local file)
- Desktop: Electron

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
- Backend API: http://localhost:3001
- Frontend: http://localhost:3000
- Electron app (loads the frontend URL)

## Run (Production)
```bash
npm start
```
Runs Electron directly. In production, the frontend should be built first.

## Build
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
- Email: admin@solarinventory.com
- Password: admin123

## Database
- Dev DB file: `data/inventory.db`
- Production DB file: Electron userData directory (OS-specific)

The database is auto-created and seeded on first run.

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

Report types:
- `daily_sales`
- `monthly_sales`
- `inventory_stock`
- `low_stock`
- `purchase_history`
- `profit_report`

Database tools (admin only):
- `POST /database/clean`
- `POST /database/seed`

## Notes
- Electron loads the React dev server in development. If ports 3000/3001 are in use, the app will not start correctly.
- Settings screen is implemented but currently not linked in the router.
- Invoice PDF download uses Electron’s `printToPDF` and requires Electron context (not just browser).

## Troubleshooting
- Port conflicts: ensure 3000 and 3001 are free.
- If the DB is corrupted, delete `data/inventory.db` and restart.

## License
Boost Software License 1.0. See `LICENSE`.
