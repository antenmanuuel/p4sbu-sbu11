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
│   └── src/                 # Source files
│       ├── components/      # React components
│       ├── pages/           # Page components
│       ├── utils/           # Utility functions
│       └── App.jsx          # Main App component
│
├── server/                  # Backend Node.js application
│   ├── config/              # Configuration files
│   ├── middleware/          # Express middleware
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   └── server.js            # Server entry point
│
└── README.md                # Project documentation
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
