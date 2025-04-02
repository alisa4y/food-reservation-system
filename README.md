# Food Reservation Management System

A comprehensive system for managing employee meal reservations with barcode scanning functionality.

## Features

- **Employee Management**: Add, edit, delete, and search employees with support for Excel import
- **Reservation Management**: Create and manage meal reservations for breakfast, lunch, and dinner
- **Reporting**: Generate reports with various filtering options
- **Barcode Scanning**: Scan employee barcodes to validate meal reservations
- **Meal Token Generation**: Generate PDF meal tokens for valid reservations
- **RTL Support**: Right-to-left layout for Persian text
- **Security**: Admin panel accessible only from local network, scanner page publicly accessible

## Technology Stack

- **Backend**: Express.js, Node.js
- **Database**: SQLite3
- **Frontend**: Bootstrap 5 RTL, jQuery, HTML5, CSS3
- **Authentication**: Session-based with IP restrictions
- **Barcode Scanning**: HTML5-QRCode library
- **PDF Generation**: PDFKit

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```

## Usage

### Scanner Page (Public)

Access the scanner page at `/scanner`. This page allows:

- Scanning employee barcodes using the device camera
- Manual entry of employee IDs
- Validation of meal reservations based on current time
- Generation of meal tokens as PDFs

### Admin Panel (Local Only)

Access the admin panel at `/admin`. This includes:

- Dashboard with summary statistics
- Employee management
- Reservation management
- Reporting with filtering options

Default admin credentials:

- Username: `admin`
- Password: `admin123`

## Security

The admin panel is configured to be accessible only from local networks for security purposes. The scanner page is publicly accessible to allow employees to scan their barcodes from any device.

## Directory Structure

```
food-reservation-system/
├── database/               # SQLite database files
├── public/                 # Static files (CSS, JS, images)
│   ├── css/                # Stylesheets
│   ├── js/                 # Client-side JavaScript
│   └── tokens/             # Generated meal tokens (PDFs)
├── src/                    # Source code
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # Database models
│   ├── routes/             # Express routes
│   ├── utils/              # Utility functions
│   └── views/              # EJS templates
│       ├── admin/          # Admin panel views
│       ├── partials/       # Reusable view components
│       └── scanner/        # Scanner page views
├── server.js               # Main application file
└── package.json            # Project metadata and dependencies
```

## License

This project is licensed under the MIT License.
