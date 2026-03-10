# Solar Inventory Desktop

A complete, production-ready desktop application for managing solar equipment inventory with modern UI/UX design and comprehensive features.

## Features

- **Modern Desktop Application**: Built with Electron.js for cross-platform desktop deployment
- **Professional UI/UX**: Glassmorphism design with gradients, animations, and responsive layout
- **Complete Inventory Management**: CRUD operations for products, suppliers, and inventory tracking
- **Advanced Reporting**: Sales, purchases, inventory, and financial reports with export capabilities
- **Comprehensive Settings**: Multi-tab configuration for business, inventory, security, and backup
- **Authentication System**: Secure login with password management
- **Data Export**: CSV and JSON export for all reports and data
- **Real-time Dashboard**: Visual metrics, recent activity feeds, and quick actions
- **SQLite Database**: Local database with full schema and relationships

## Tech Stack

- **Frontend**: React.js with TailwindCSS
- **Backend**: Node.js with Express.js
- **Database**: SQLite with full schema
- **Desktop**: Electron.js
- **UI Components**: Custom components with modern design system

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd solar-inventory-desktop
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install frontend dependencies
   cd frontend
   npm install
   cd ..

   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

## Sample Data

The application comes with comprehensive sample data for testing all features. After installation, the database will be automatically populated with:

- **7 Product Categories** (Solar Panels, Inverters, Batteries, etc.)
- **5 Suppliers** with realistic Pakistani business information
- **8 Customers** with contact details and addresses
- **15 Products** with various solar equipment and stock levels
- **10 Sales Transactions** with complete sale items and payments
- **8 Purchase Transactions** from different suppliers
- **10 Expense Entries** for business operations

### Default Admin Credentials
- **Email**: admin@solarinventory.com
- **Password**: admin123

For detailed information about the sample data, see [SAMPLE_DATA.md](SAMPLE_DATA.md).

### Database Management
- **Reset Database**: Use the admin panel to clean and reseed with sample data
- **API Endpoint**: `POST /api/database/clean` (admin only)

## Running the Application

### Development Mode
```bash
npm run dev
```
This will start:
- Backend server on port 3001
- Frontend development server on port 3000
- Electron desktop application

### Production Mode
```bash
npm start
```
Starts the packaged Electron application directly.

### Individual Components
```bash
# Start only backend
npm run dev:backend

# Start only frontend
npm run dev:frontend

# Start only Electron app (requires servers running)
npm start
```

## Building for Distribution

```bash
# Build frontend
npm run build:frontend

# Build Electron app
npm run build:electron

# Or build everything at once
npm run dist
```

The built application will be in the `dist` folder.

## Application Structure

```
solar-inventory-desktop/
├── electron/           # Electron main process and preload scripts
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Main application pages
│   │   └── utils/      # Utility functions
├── backend/            # Express.js API server
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   └── database/       # SQLite database setup
└── package.json        # Main package configuration
```

## Key Features

### Dashboard
- Visual metrics cards with gradients
- Recent sales and purchases feeds
- Top products display
- Quick action buttons

### Inventory Management
- Product catalog with categories
- Supplier management
- Stock level tracking
- Low stock alerts

### Reports
- Sales reports with filtering
- Purchase reports
- Inventory status reports
- Financial summaries
- Data export (CSV/JSON)

### Settings
- General application settings
- Business information configuration
- Inventory preferences
- User management
- Security settings
- Backup and restore

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User authentication
- `products` - Product catalog
- `suppliers` - Supplier information
- `sales` - Sales transactions
- `purchases` - Purchase transactions
- `inventory` - Stock levels
- `categories` - Product categories

## Security

- Secure authentication with password hashing
- Context isolation in Electron
- Preload scripts for secure API access
- Input validation and sanitization

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000 and 3001 are available
2. **Cache issues**: The application automatically disables GPU acceleration to avoid cache problems
3. **Permission errors**: Run as administrator if encountering permission issues

### Resetting the Application

If you need to reset the database:
1. Stop all running processes
2. Delete the SQLite database file
3. Restart the application (it will recreate the database)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
