# Concurrency Testing

This document outlines how to run concurrency tests for the parking reservation system.

## Purpose

The concurrency tests verify that the system correctly handles scenarios where multiple users attempt to reserve the same parking spot simultaneously. This ensures:

1. Only one user can successfully reserve a spot
2. All other users receive appropriate error messages
3. The system remains stable under concurrent load

## Setup and Running Tests

### Prerequisites

- MongoDB Atlas cluster (connection is pre-configured)
- Node.js server running locally
- Test user accounts will be created automatically

### Running the Test

1. Make sure your server is running:
```
npm run start
```

2. In a separate terminal, run the concurrency test:
```
npm run test:concurrency
```

3. Examine the test results:
- Console output shows summary statistics
- Detailed results are saved to `concurrency-test-results.json`

### Configuration

You can adjust test parameters in `tests/concurrencyTest.js`:

- `NUM_USERS`: Number of concurrent users to simulate
- `TEST_DATE`, `TEST_START_TIME`, `TEST_END_TIME`: When to schedule the reservations
- `TARGET_LOCATION`, `TARGET_LOT`: What parking lot to target
- `TEST_ID`: A unique identifier for test data (auto-generated based on timestamp)

## How It Works

1. The test first creates a set of test user accounts with a unique test identifier
2. One user makes an initial reservation for a specific spot
3. Multiple users then attempt to reserve the same spot concurrently
4. The test records success/failure rates and timing information
5. All test data (users, cars, reservations) is thoroughly cleaned up after the test completes

## Data Cleanup

The test includes a comprehensive cleanup process that:

1. Removes all test user accounts created during the test
2. Removes all car records created by test users
3. Removes all reservations made during the test
4. Verifies cleanup was successful by checking for any remaining test data

This ensures your database won't accumulate test data even if tests are run repeatedly.

## Troubleshooting

- If the server URL needs to be changed, modify `API_BASE_URL` in the test file
- The MongoDB connection is configured to use your MongoDB Atlas cluster
- Make sure your payment system is in test mode to handle test payments
- If cleanup fails, you can manually remove test data by searching for records with the test identifier in their email or testId field 