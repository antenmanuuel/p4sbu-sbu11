# P4SBU - Stony Brook University Parking Management System

CSE 416 Section - Professor Abid Malik

Team SBU11

Team Members -

- Tahir Tuzun
- Srinesh Ramesh
- Andrew Moscheni
- Anten Manuuel

## Project Overview

The P4SBU Parking Management System is a comprehensive solution designed to modernize and streamline parking operations at Stony Brook University. This full-stack application serves the diverse needs of students, faculty, staff, and visitors by providing an intuitive platform for managing all aspects of campus parking.

The system offers real-time parking availability information, an advanced reservation system, digital permit management, and secure payment processing. With role-based access control, the platform delivers tailored experiences for regular users, faculty members with specialized parking needs, and administrators who oversee the entire parking infrastructure.

Built with modern web technologies and following responsive design principles, P4SBU ensures accessibility across all devices while maintaining a consistent, user-friendly interface. The application integrates with mapping services for intuitive location finding and implements secure payment processing for reservations, permits, and citation payments.

## Features

- **Real-time Parking Availability**: View available spaces in each parking lot in real-time.
- **Advanced Search & Filtering**: Find parking based on location, time, date, price, and permit types.
- **Interactive Map Interface**: View parking lot locations and navigate campus with Mapbox integration.
- **Comprehensive User Management**: Register, login, profile management, and vehicle registration.
- **Reservation System**: Create, view, modify, and cancel parking reservations.
- **Permit Management**: Purchase, view, and manage parking permits.
- **Billing & Payment Processing**: Secure payments with Stripe integration and transaction history.
- **Citation Management**: View and pay parking citations/tickets.
- **Admin Dashboard**: Manage parking lots, users, permits, and view analytics.
- **Faculty Features**: Request and manage event parking.
- **Reporting & Analytics**: Generate reports and view usage statistics.
- **Contact & Support System**: Submit inquiries and get support.
- **Responsive Design**: Works seamlessly on desktop and mobile devices.
- **Email Notifications**: Get alerts for reservation confirmations, permit approvals, and more.

## System Architecture

The project follows a client-server architecture:

- **Client**: React-based frontend application with responsive UI
- **Server**: Node.js/Express backend API with MongoDB database

## Technologies Used

### Frontend

- React.js
- React Router for navigation
- Tailwind CSS for styling
- Mapbox for maps and location services
- React Icons
- Vite as build tool
- Axios for API requests
- React Datepicker
- React Toastify for notifications
- Recharts for data visualization
- Stripe.js for payment processing

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- Bcrypt for password hashing
- Nodemailer for email functionality
- Express Validator for request validation
- Stripe API for payment processing
- PDF Kit for generating PDF documents
- New Relic for application monitoring

### Testing

- Cypress for end-to-end testing
- Jest for unit testing
- React Testing Library for component testing
- Supertest for API testing
- MongoDB Memory Server for test database

## Installation and Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Setup Instructions

1. Clone the repository:

```
git clone https://github.com/your-username/p4sbu-sbu11.git
cd p4sbu-sbu11
```

2. Install dependencies for both client and server:

```
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Set up environment variables:

Create a `.env` file in the server directory with the following variables:

```
# MongoDB Atlas connection
MONGODB_URI=your_mongodb_atlas_connection_string

# Local MongoDB connection (use this if Atlas is having issues)
# MONGODB_URI=mongodb://localhost:27017/p4sbu-db

# JWT Secret
JWT_SECRET=your_jwt_secret

# Server port
PORT=8080

# Email configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
# Note: Replace with a 16-character App Password from Google Account
# To generate an App Password:
# 1. Go to your Google Account > Security
# 2. Enable 2-Step Verification if not already enabled
# 3. Go to App passwords
# 4. Select "Mail" and "Other" (Custom name: "SBU Parking System")
# 5. Copy the 16-character password generated
EMAIL_FROM=noreply@sbuparkingsystem.com
CLIENT_URL=http://localhost:5173
CLIENT_BASE_URL=http://localhost:5173

# Production URLs for deployment
PROD_CLIENT_URL=https://p4sbu-parking-app.herokuapp.com
PROD_CLIENT_BASE_URL=https://p4sbu-parking-app.herokuapp.com

# Stripe API keys
# Get your keys from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Relic configuration
NEW_RELIC_APP_NAME=P4SBU
NEW_RELIC_LICENSE_KEY=your_new_relic_license_key

# Gemini AI configuration for chatbot
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key
```

Create a `.env` file in the client directory with the following variables:

```
# Mapbox token for maps and geocoding
# To get a token:
# 1. Sign up at https://account.mapbox.com/auth/signup/
# 2. Go to https://account.mapbox.com/ and create a token
# 3. Copy the token here
VITE_REACT_APP_MAPBOX_TOKEN=your_mapbox_token

# API URL (default is http://localhost:8080/api)
VITE_REACT_APP_API_URL=http://localhost:8080/api

# Stripe publishable key for payment processing
# Get your key from: https://dashboard.stripe.com/apikeys
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# API URL
VITE_API_URL=http://localhost:8080/api
```

## Running the Application

1. Start the server:

```
cd server
npm start
```

2. Start the client:

```
cd client
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173` to view the application.

## Testing

### End-to-End Testing with Cypress

The project uses Cypress for end-to-end testing to ensure the application works correctly from a user's perspective.

#### Running Cypress Tests

To run Cypress tests:

1. Make sure the application is running (both server and client)
2. Open a new terminal and navigate to the project root directory:

```bash
# From the project root directory (not inside client or server)

# Open the Cypress Test Runner UI
npx cypress open

# Run tests in headless mode
npx cypress run
```

#### Existing Test Suites

- **Authentication Tests**: Tests for user login and registration functionality
  - `login.cy.js`: Tests valid and invalid login scenarios
  - `register.cy.js`: Tests user registration process

- **Admin Functionality Tests**: Tests for administrative capabilities
  - `editLot.cy.js`: Tests editing parking lot information
  - `editPermit.cy.js`: Tests permit management functions

- **Concurrency Testing**: Tests for concurrency handling
  - `concurrencyTest.cy.js`: Tests concurrency scenarios

#### Adding New Tests

To add new Cypress tests:
```javascript
describe('Feature Test', () => {
  it('should perform some action', () => {
    cy.visit('/some-page');
    cy.get('[data-testid="element"]').click();
    cy.url().should('include', '/expected-path');
  });
});
```

### Backend Testing with Jest

The server-side code is tested using Jest and Supertest to ensure API endpoints work correctly and handle errors properly.

#### Running Jest Tests

To run the backend tests:

```bash
# Navigate to the server directory
cd server

# Run all tests
npm test

# Run tests with coverage report
npx jest --coverage

# Run a specific test file
npx jest tests/lots.test.js
```

#### Existing Test Suites

- **Authentication Tests**: Tests for user authentication endpoints
  - `auth.test.js`: Tests login, registration, password reset, and token verification

- **User Management Tests**: Tests for user-related endpoints
  - `users.test.js`: Tests profile management, password changes, and user data retrieval

- **Parking Lot Tests**: Tests for parking lot management API
  - `lots.test.js`: Tests CRUD operations, filtering, availability checking, and pagination

- **Permit Type Tests**: Tests for permit type management
  - `permit_types.test.js`: Tests permit type creation, retrieval, updating, and deletion

- **Permits Tests**: Tests for permit management functionality 
  - `permits.test.js`: Tests permit creation, retrieval, updating, and cancellation

- **Reservation Tests**: Tests for parking reservation functionality
  - `reservations.test.js`: Tests creating, retrieving, canceling, and extending reservations

- **Car Management Tests**: Tests for vehicle registration and management
  - `cars.test.js`: Tests adding, updating, and removing vehicles from user accounts

- **Ticket/Citation Tests**: Tests for parking ticket management
  - `tickets.test.js`: Tests ticket creation, payment processing, and status updates

- **Event Parking Tests**: Tests for event parking request functionality
  - `eventParking.test.js`: Tests event parking request creation, approval, and management

- **Contact/Support Tests**: Tests for user support functionality
  - `contact.test.js`: Tests contact form submissions and support ticket management

- **Admin Tests**: Tests for admin-only functionality
  - `admin.test.js`: Tests user approval, admin-only operations, and system management

#### Concurrency Testing

The project includes a concurrency test script to verify that the parking reservation system correctly handles multiple simultaneous reservation attempts when parking spaces are limited.

##### Running Concurrency Tests

To run the concurrency test:

```bash
# From the project root directory
node server/tests/concurrencyTest.js

# Run with specific number of users (e.g., 15 users competing for 2 spots)
node server/tests/concurrencyTest.js 15

# Run with specific users and capacity
node server/tests/concurrencyTest.js --users 20 --capacity 5
# Or using short options
node server/tests/concurrencyTest.js -u 20 -c 5

# Display help information
node server/tests/concurrencyTest.js --help
```

The concurrency test:
- Creates a test parking lot with limited capacity
- Simulates multiple users trying to reserve parking spaces simultaneously
- Uses MongoDB transactions to ensure atomic operations
- Reports detailed results of which users succeeded and which failed
- Provides timing information and concurrency metrics
- Cleans up all test data after completion

This test is essential for verifying the system's ability to handle race conditions and maintain data integrity during peak usage periods.

#### Coverage Reporting

Jest generates code coverage reports to help identify untested parts of the application. The coverage report can be found in the `server/coverage` directory after running tests with the `--coverage` flag.

To view the coverage report:
1. Run `npx jest --coverage`
2. Open `server/coverage/lcov-report/index.html` in your browser

#### Writing New Tests

To add new Jest tests:

1. Create a test file in the `server/tests` directory with a `.test.js` extension
2. Use Jest and Supertest to test your API endpoints
3. Mock dependencies as needed using Jest's mocking capabilities

Example:
```javascript
const request = require('supertest');
const express = require('express');
const myRoute = require('../routes/myRoute');

const app = express();
app.use('/api', myRoute);

describe('My API Endpoint', () => {
  it('should return expected data', async () => {
    const response = await request(app).get('/api/my-endpoint');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
```

### Fixtures

Test fixtures are located in the `cypress/fixtures` directory:

- `users.json`: Contains test user credentials
- `lots.json`: Contains parking lot test data

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - Login a user
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-token` - Verify JWT token validity

### User Endpoints

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change user password
- `GET /api/users/activity` - Get user activity history
- `GET /api/users/billing-history` - Get billing and payment history
- `GET /api/users/receipt/:id` - Get receipt for a specific payment
- `POST /api/users/feedback` - Submit user feedback

### Parking Lot Endpoints

- `GET /api/lots` - Get all parking lots with filtering and pagination
- `GET /api/lots/:id` - Get a specific parking lot by ID
- `POST /api/lots` - Create a new parking lot (admin only)
- `PUT /api/lots/:id` - Update a parking lot (admin only)
- `PATCH /api/lots/:id/status` - Update a lot's status (admin only)
- `GET /api/lots/availability` - Get real-time parking lot availability

### Reservation Endpoints

- `GET /api/reservations` - Get user's reservations with filtering options
- `GET /api/reservations/:id` - Get a specific reservation details
- `POST /api/reservations` - Create a new parking reservation
- `POST /api/reservations/:id/cancel` - Cancel an existing reservation
- `POST /api/reservations/:id/extend` - Extend reservation time
- `PUT /api/reservations/check-expired` - Check and update expired reservations

### Car Management Endpoints

- `GET /api/cars` - Get user's registered vehicles
- `GET /api/cars/primary` - Get user's primary vehicle
- `POST /api/cars` - Register a new vehicle
- `PUT /api/cars/:id` - Update vehicle information
- `DELETE /api/cars/:id` - Remove a vehicle

### Permit Endpoints

- `GET /api/permits` - Get user's active permits
- `POST /api/permits` - Purchase a new permit
- `PUT /api/permits/:id` - Update permit details
- `GET /api/permits/:id` - Get specific permit details
- `POST /api/permits/:id/cancel` - Request permit cancellation

### Permit Types Endpoints

- `GET /api/permit-types` - Get all permit types
- `POST /api/permit-types` - Create a new permit type (admin only)
- `PUT /api/permit-types/:id` - Update a permit type (admin only)
- `DELETE /api/permit-types/:id` - Delete a permit type (admin only)

### Citation/Ticket Endpoints

- `GET /api/tickets/user/tickets` - Get user's parking citations
- `POST /api/tickets/user/tickets/:ticketId/pay` - Pay a citation
- `POST /api/tickets/admin/tickets` - Create a new ticket (admin only)
- `GET /api/tickets/admin/tickets` - Get all tickets (admin only)
- `GET /api/tickets/admin/tickets/:ticketId` - Get ticket details (admin only)
- `PUT /api/tickets/admin/tickets/:ticketId` - Update ticket (admin only)
- `DELETE /api/tickets/admin/tickets/:ticketId` - Delete ticket (admin only)

### Event Parking Endpoints

- `GET /api/event-parking` - Get all event parking requests
- `POST /api/event-parking` - Submit a new event parking request (faculty only)
- `GET /api/event-parking/:id` - Get specific event parking request
- `PUT /api/event-parking/:id` - Update event parking request (admin/faculty)
- `DELETE /api/event-parking/:id` - Cancel event parking request

### Statistics and Reporting Endpoints

- `GET /api/statistics/revenue` - Get revenue statistics (admin only)
- `GET /api/statistics/usage` - Get parking usage statistics (admin only)
- `GET /api/statistics/violations` - Get parking violation statistics (admin only)
- `GET /api/statistics/dashboard` - Get admin dashboard statistics

### Admin Management Endpoints

- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/:id/approve` - Approve a user (admin only)
- `PUT /api/admin/users/:id/status` - Change user status (admin only)
- `GET /api/admin/reports` - Generate system reports (admin only)

## Project Structure

```
p4sbu-sbu11/
├── client/                  # Frontend React application
│   ├── public/              # Public assets
│   ├── src/                 # Source files
│   │   ├── assets/          # Static assets like images and icons
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Utility functions
│   │   ├── App.jsx          # Main App component
│   │   ├── AppContent.jsx   # App content wrapper
│   │   ├── index.css        # Global CSS
│   │   └── main.jsx         # Application entry point
│   ├── cypress.config.js    # Client-specific Cypress config
│   ├── index.html           # Main HTML entry
│   ├── package.json         # Client dependencies
│   ├── postcss.config.js    # PostCSS configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── vite.config.js       # Vite build tool configuration
│   ├── .npmrc               # NPM configuration
│   ├── build-env.js         # Build environment setup
│   └── eslint.config.js     # ESLint configuration
│
├── server/                  # Backend Node.js application
│   ├── config/              # Configuration files
│   ├── middleware/          # Express middleware
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   ├── services/            # Backend services
│   ├── utils/               # Utility functions
│   ├── scripts/             # Server scripts
│   ├── tests/               # Jest test files
│   ├── coverage/            # Jest coverage reports
│   ├── reports/             # System reports
│   ├── jest.config.js       # Jest configuration
│   ├── server.js            # Server entry point
│   ├── newrelic.js          # New Relic monitoring configuration
│   ├── package.json         # Server dependencies
│   └── .gitignore           # Server-specific gitignore
│
├── cypress/                 # Main Cypress E2E tests (at root level)
│   ├── e2e/                 # Test files
│   ├── fixtures/            # Test data
│   ├── plugins/             # Cypress plugins
│   ├── support/             # Helper functions and commands
│   ├── screenshots/         # Test screenshot captures
│   └── downloads/           # Files downloaded during tests
│
├── .github/                 # GitHub configuration files
├── package.json             # Root-level dependencies
├── LICENSE.md               # License file
├── static.json              # Static file configuration
├── Procfile                 # Heroku deployment configuration
├── HEROKU_DEPLOYMENT.md     # Heroku deployment guide
├── HEROKU_ENV_SETUP.md      # Heroku environment setup guide
├── .gitignore               # Git ignore configuration
├── cypress.config.js        # Main Cypress configuration
└── README.md                # Project documentation
```

## Deployment

The application is configured for deployment on **Vercel**. See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Fork this repository
2. Connect your GitHub repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy with one click

For detailed setup instructions, environment variables, and troubleshooting, see the [Vercel Deployment Guide](VERCEL_DEPLOYMENT.md).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
