# P4SBU - Stony Brook University Parking Management System

CSE 416 Section - Professor Abid Malik

Team SBU11

Team Members -

- Tahir Tuzun
- Srinesh Ramesh
- Andrew Moscheni
- Anten Manuuel

## Project Overview

A comprehensive parking management system for Stony Brook University that helps students, faculty, and visitors find and reserve parking spots across campus.

The SBU Parking Management System is designed to streamline the process of finding, viewing, and reserving parking spaces at Stony Brook University. The application provides real-time information about parking lot availability, permits required, pricing, and features to help users make informed decisions.

## Features

- **Real-time Parking Availability**: View available spaces in each parking lot in real-time.
- **Advanced Search**: Find parking based on location, time, and date.
- **Path-based Distance Calculation**: Uses Dijkstra's algorithm to calculate realistic distances between locations.
- **Filtering Options**: Filter parking lots by price, permit types, and features.
- **Interactive Map**: View parking lot locations on an interactive map.
- **User Authentication**: Register and login to manage your profile and reservations.
- **Admin Dashboard**: Manage parking lots, update availability, and view analytics.
- **Responsive Design**: Works seamlessly on desktop and mobile devices.

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

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- Bcrypt for password hashing
- Mailgun for password reset functionality

### Testing

- Cypress for end-to-end testing
- Jest for unit testing
- React Testing Library for component testing

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
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Create a `.env` file in the client directory with the following variables:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
```

## Running the Application

1. Start the server:

```
cd server
npm run dev
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

#### Adding New Tests

To add new Cypress tests:

1. Create a new test file in the `cypress/e2e` directory with a `.cy.js` extension
2. Use the Cypress API to interact with your application
3. Write assertions to verify expected behavior

Example:
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
  - `auth.test.js`: Tests login, registration, password reset

- **User Management Tests**: Tests for user-related endpoints
  - `users.test.js`: Tests profile management, password changes

- **Parking Lot Tests**: Tests for parking lot management API
  - `lots.test.js`: Tests CRUD operations, filtering, pagination

- **Permit Type Tests**: Tests for permit type management
  - `permit_types.test.js`: Tests permit type creation and management

- **Ticket Tests**: Tests for parking ticket management
  - `tickets.test.js`: Tests ticket creation, payment, and queries

- **Admin Tests**: Tests for admin-only functionality
  - `admin.test.js`: Tests user approval, admin-only operations

- **Statistics Tests**: Tests for reporting and statistics
  - `statistics.test.js`: Tests revenue and usage reports

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

- `POST /api/login` - Login a user
- `POST /api/register` - Register a new user

### User Endpoints

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/change-password` - Change user password
- `GET /api/user/activity` - Get user activity history

### Parking Lot Endpoints

- `GET /api/lots` - Get all parking lots with filtering and pagination
- `GET /api/lots/:id` - Get a specific parking lot by ID
- `POST /api/lots` - Create a new parking lot (admin only)
- `PUT /api/lots/:id` - Update a parking lot (admin only)
- `PATCH /api/lots/:id/status` - Update a lot's status (admin only)

### Permit Types Endpoints

- `GET /api/permit-types` - Get all permit types (admin only)
- `POST /api/permit-types` - Create a new permit type (admin only)
- `PUT /api/permit-types/:id` - Update a permit type (admin only)
- `DELETE /api/permit-types/:id` - Delete a permit type (admin only)

### Admin Endpoints

- `GET /api/admin` - Admin dashboard data

## Project Structure

```
p4sbu-sbu11/
├── client/                  # Frontend React application
│   ├── public/              # Public assets
│   ├── src/                 # Source files
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Utility functions
│   │   └── App.jsx          # Main App component
│   ├── cypress.config.js    # Client-specific Cypress config
│   ├── .env                 # Environment variables
│   ├── index.html           # Main HTML entry
│   ├── package.json         # Client dependencies
│   ├── postcss.config.js    # PostCSS configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── vite.config.js       # Vite build tool configuration
│   └── eslint.config.js     # ESLint configuration
│
├── server/                  # Backend Node.js application
│   ├── config/              # Configuration files
│   ├── middleware/          # Express middleware
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   ├── services/            # Backend services
│   ├── tests/               # Jest test files
│   ├── coverage/            # Jest coverage reports
│   ├── reports/             # System reports
│   ├── jest.config.js       # Jest configuration
│   ├── server.js            # Server entry point
│   ├── package.json         # Server dependencies
│   └── .env                 # Server environment variables
│
├── cypress/                 # Main Cypress E2E tests (at root level)
│   ├── e2e/                 # Test files
│   ├── fixtures/            # Test data
│   ├── support/             # Helper functions and commands
│   ├── screenshots/         # Test screenshot captures
│   └── downloads/           # Files downloaded during tests
│
├── package.json             # Root-level dependencies
├── .gitignore               # Git ignore configuration
├── cypress.config.js        # Main Cypress configuration
└── README.md                # Project documentation
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
