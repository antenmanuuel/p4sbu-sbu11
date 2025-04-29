const cypress = require('cypress');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * Generates a random password of specified length
 * @param {number} length - Length of the password to generate
 * @returns {string} - Random password
 */
function generateRandomPassword(length = 12) {
    // Define character sets
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()-_=+';

    const allChars = lowercase + uppercase + numbers + symbols;

    // Generate random bytes
    const randomBytes = crypto.randomBytes(length);

    // Convert to password
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = randomBytes[i] % allChars.length;
        password += allChars.charAt(randomIndex);
    }

    // Ensure password has at least one of each required character type
    password = ensurePasswordComplexity(password, lowercase, uppercase, numbers, symbols);

    return password;
}

/**
 * Ensures a password has at least one character from each required character set
 * @param {string} password - The password to check/modify
 * @param {string} lowercase - Lowercase character set
 * @param {string} uppercase - Uppercase character set
 * @param {string} numbers - Numbers character set
 * @param {string} symbols - Symbols character set
 * @returns {string} - Password with ensured complexity
 */
function ensurePasswordComplexity(password, lowercase, uppercase, numbers, symbols) {
    const requiredCharSets = [lowercase, uppercase, numbers, symbols];
    const passwordChars = password.split('');

    // For each character set, ensure there's at least one character from it
    for (let i = 0; i < requiredCharSets.length; i++) {
        const charSet = requiredCharSets[i];
        const hasCharFromSet = passwordChars.some(char => charSet.includes(char));

        if (!hasCharFromSet) {
            // Replace a random character with one from this set
            const randomIndex = Math.floor(Math.random() * passwordChars.length);
            const randomCharFromSet = charSet.charAt(Math.floor(Math.random() * charSet.length));
            passwordChars[randomIndex] = randomCharFromSet;
        }
    }

    return passwordChars.join('');
}

/**
 * Generates dummy user data with a random password
 * @param {number} i - Index of the user
 * @returns {object} - User data object
 */
async function generateDummyUser(i) {
    // Generate a random password
    const plainPassword = generateRandomPassword();

    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Generate a valid SBU ID (exactly 9 digits)
    const sbuId = String(100000000 + Math.floor(Math.random() * 900000000)).substring(0, 9);

    // Store both for reference, but only the hashed one would be saved to DB
    return {
        firstName: "user" + i.toString(),
        lastName: "User",
        email: "user" + i.toString() + "@stonybrook.edu",
        sbuId: sbuId, // Now properly formatted as 9 digits
        password: hashedPassword,
        plainPassword: plainPassword, // For reference - remove when actually inserting to DB
        userType: "student",
        status: "active", // Add status field
        dateJoined: new Date(),
        isApproved: true,
        phone: "123-456-7890",
        address: "123 Campus Drive, Stony Brook, NY 11790",
        emergencyContact: "Emergency Contact " + i,
        car: null,
        createdAt: new Date(),
        stripeCustomerId: null, // Add stripe fields
        defaultPaymentMethodId: null,
        __v: 0
    };
}

//run a cypress test using the cypress.run method
async function runCypressTest(spec,user) {
  try {
    const results = await cypress.run({
      spec: spec,
      env: {
        user: user
      }
    });
    if (results.totalFailed === 0 && results.totalPassed > 0) {
      return results.totalDuration;
    } else {
      console.error(`Test ${spec} failed.`);
      return null;
    }
  } catch (err) {
    console.error(`Error running test ${spec}:`, err);
    return null;
  }
}

//calculate mean
function mean(arr) {
    if (!arr || arr.length === 0) {
      return 0;
    }
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
}

//calculate median
function median(arr){
    if (!arr || arr.length === 0) {
        return 0;
    }
    const sortedArr = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sortedArr.length / 2);
    if (sortedArr.length % 2 === 0) {
        return (sortedArr[mid - 1] + sortedArr[mid]) / 2;
    } else {
        return sortedArr[mid];
    }
}

//calculate standard deviation
function standard_deviation(arr) {
    if (!arr || arr.length === 0) {
      return 0;
    }
    const mean = calculateMean(arr);
    const squaredDifferences = arr.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / arr.length;
    return Math.sqrt(variance);
}

describe('Concurrency Testing', async () => {
    const runTimes = [];
    const numberOfConcurrentUsers = 99; //change as needed for the test
    const concurrentPromises = [];

    const users = Array.from({length:numberOfConcurrentUsers+1}, async (_,i)=>{
        return await generateDummyUser(i);
    });

    before(() => {
        cy.task('db:seedMongo', { users }).then((seededUsers) => {
            seededUsers.forEach((user) => {
            if (user.added) {
                cy.log(`User "${user.email}" added to MongoDB.`);
            } else {
                cy.log(`User "${user.email}" already exists in MongoDB.`);
            }
            });
        });
    });

    after(() => {
        cy.task('db:cleanupMongo', { usernames: users.map(user => user.email) }).then((removedUsers) => {
            removedUsers.forEach(username => {
            cy.log(`User "${username}" removed from MongoDB.`);
            });
        });
    });

    //run the initial reservation test
    console.log('Running the initial reservation test...');
    let user = users[0];

    const reservationTime = await runCypressTest('./cypress/reservationTests/initialReservation.cy.js', user);
    if (reservationTime !== null) {
        runTimes.push(reservationTime);
        console.log('Reservation test completed successfully.');
        
        //simulate concurrent users trying to access the spot
        console.log('\nSimulating concurrent user access...');
        for (let i = 1; i < numberOfConcurrentUsers+1; i++) {
            let user = users[i];
            concurrentPromises.push(runCypressTest('./cypress/reservationTests/consequentReservations.cy.js', user));
        }

        const concurrentRunTimes = await Promise.all(concurrentPromises);
        concurrentRunTimes.forEach((time) => {
            if (time !== null) {
            runTimes.push(time);
            }
        });

        console.log('\nAll tests completed.');
        //calculate statistics of the runs
        const avrg = mean(runTimes);
        const mdn = median(runTimes);
        const stddev = standard_deviation(runTimes);
        console.log(`\nAverage run time of tests: ${avrg} ms\nStandard Devation: ${stddev} ms\nMedian run time: ${mdn} ms`);
    } else {
        throw new Error("Initial Reservation Failed");
    }
});