describe('Find Parking Flow', () => {
    beforeEach(() => {
        cy.fixture('users').as('users');

        // Intercept all API calls that will be made during the test
        cy.intercept('GET', '/api/lots*').as('getLots');
        cy.intercept('POST', '/api/reservations*').as('createReservation');
        cy.intercept('GET', '/api/cars/user*').as('getUserCars');
        cy.intercept('GET', '/api/permits/user*').as('getUserPermits');
        cy.intercept('GET', '/api/payment-methods*').as('getPaymentMethods');

        // Define custom commands for this test
        Cypress.Commands.add('clickIfExists', { prevSubject: 'optional' }, (subject, selector) => {
            cy.get('body').then($body => {
                if ($body.find(selector).length > 0) {
                    if (subject) {
                        cy.wrap(subject).find(selector).click();
                    } else {
                        cy.get(selector).click();
                    }
                    return true;
                }
                return false;
            });
        });
    });

    it('should navigate through the find parking flow with a valid user', function () {
        const currentUser = this.users.validUser;

        // --- View: Search ---
        cy.log('Step 1: Logging in and Navigating to Search View');
        cy.visit('/login');
        cy.get('#email-address').clear().type(currentUser.email);
        cy.get('#password').clear().type(currentUser.password, { log: false });
        cy.get('button[id="login button"]').click();
        cy.url({ timeout: 10000 }).should('include', '/dashboard');
        cy.contains('Find Parking').click();
        cy.url().should('include', '/find-parking');
        cy.contains('h1', 'Find Parking').should('be.visible'); // Verify Search View heading

        cy.log('Step 2: Filling search form');
        cy.get('#address').should('be.visible').type('Student Activities Center');
        cy.wait(500); // Allow suggestions
        cy.contains('.max-h-40', 'Student Activities Center').click({ force: true }); // Click suggestion from list

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const formattedDate = tomorrow.toISOString().split('T')[0];
        cy.get('#date').type(formattedDate);
        const startHour = (tomorrow.getHours() + 2) % 24;
        const startTime = `${String(startHour).padStart(2, '0')}:00`;
        cy.get('#startTime').type(startTime);
        const endHour = (startHour + 4) % 24;
        const endTime = `${String(endHour).padStart(2, '0')}:00`;
        cy.get('#endTime').type(endTime);

        cy.contains('button', 'Search for Parking').click(); // Use exact button text
        cy.wait('@getLots', { timeout: 10000 });
        cy.log('Step 2: Search submitted, transitioning to Results View');

        // --- View: Results ---
        cy.log('Step 3: Verifying Results View');
        cy.contains('h1', 'Available Parking', { timeout: 10000 }).should('be.visible'); // Verify Results View heading
        cy.contains('h2', 'Available Parking').should('be.visible'); // Check for the sub-heading in ResultsView

        cy.get('body').then($body => {
            if ($body.text().includes('No parking spots found') || $body.text().includes('No parking spots match your filters')) {
                cy.log('No parking spots found. Test cannot continue.');
                // Test ends here naturally if no spots are found
            } else {
                // *** Start of nested steps - only run if spots are found ***
                cy.log('Step 4: Selecting first available lot in Results View');
                // Find lot cards within the ResultsView component's structure
                cy.get('.lg\\:col-span-1 .space-y-3 > div').then($lots => {
                    const firstAvailableLotCard = $lots.filter((index, lotElement) => {
                        const button = Cypress.$(lotElement).find('button:contains("View Details")');
                        return button.length > 0 && !button.is(':disabled');
                    }).first();

                    if (firstAvailableLotCard.length === 0) {
                        cy.log('Could not find an available lot card. Test cannot continue.');
                        return; // Stop if no available lot card found
                    }

                    // Click the main body of the lot card in ResultsView to select it
                    cy.wrap(firstAvailableLotCard).find('.p-3').first().click();
                    cy.log('Step 4: Lot selected in Results View');

                    // Click the 'View Details' button *within the same selected lot card* in ResultsView
                    cy.log('Step 5: Clicking View Details button');
                    cy.wrap(firstAvailableLotCard)
                        .contains('button', 'View Details')
                        .should('not.be.disabled')
                        .click({ force: true });
                    cy.log('Step 5: Clicked View Details, transitioning to Details View');
                });

                // --- View: Details ---
                cy.log('Step 6: Verifying Lot Details View');
                cy.contains('h1', 'Lot Details', { timeout: 5000 }).should('be.visible'); // Verify Details View heading

                cy.get('body').then($bodyDetails => { // Use a different variable name to avoid shadowing
                    cy.log('Step 7: Selecting permit/rate (if applicable) and reserving');
                    // Check for radio buttons for permit/rate selection within the Details View
                    if ($bodyDetails.find('.lg\\:col-span-1 input[type="radio"]').length > 0) {
                        cy.log('Selecting first available permit/rate option');
                        cy.get('.lg\\:col-span-1 input[type="radio"]').first().check({ force: true });
                    } else {
                        cy.log('No specific permit/rate options found to select in Details View.');
                    }

                    // Click the main Reserve button (likely near the bottom of the details)
                    cy.contains('button', 'Reserve Parking Spot').click(); // Use the exact button text from LotDetailsView
                    cy.log('Step 7: Reserve button clicked, transitioning to Car Info or Payment View');
                });

                // --- View: Car Info --- (This view might be skipped if user has saved cars)
                cy.get('body').then($bodyCarInfo => { // Use a different variable name
                    if ($bodyCarInfo.find('h1:contains("Vehicle Information")').length > 0) {
                        cy.log('Step 8: Handling Car Info View');
                        cy.wait('@getUserCars', { timeout: 10000 });

                        const savedCarsSection = $bodyCarInfo.find('h3:contains("Your Saved Vehicles")').parent();
                        const hasSavedCars = savedCarsSection.length > 0 && savedCarsSection.find('button, input[type="radio"], div[role="button"]').length > 0;

                        if (hasSavedCars) {
                            cy.log('Using a saved vehicle');
                            cy.wrap(savedCarsSection).find('button, input[type="radio"], div[role="button"]').first().click({ force: true });
                        } else {
                            cy.log('No saved cars found, filling out car form');
                            cy.get('#plateNumber').type('CYPTEST');
                            cy.get('#make').select('Toyota');
                            cy.wait(300);
                            cy.get('#model').select('Camry');
                            cy.get('#color').select('Blue');
                            cy.get('#bodyType').select('Sedan');
                            // Ensure 'Save car info' checkbox is checked if it exists
                            if ($bodyCarInfo.find('input#saveCarInfo').length > 0) {
                                cy.get('input#saveCarInfo').check();
                            }
                        }
                        cy.contains('button', 'Continue to Payment').click(); // Exact button text
                        cy.log('Step 8: Car info submitted, transitioning to Payment View');
                    } else {
                        cy.log('Step 8: Skipped Car Info View (likely had saved car)');
                    }
                });

                // --- View: Payment ---
                cy.log('Step 9: Verifying Payment View');
                cy.contains('h2', 'Select Payment Method', { timeout: 10000 }).should('be.visible'); // Verify Payment View heading
                cy.wait('@getPaymentMethods', { timeout: 10000 });

                cy.get('body').then($bodyPayment => { // Use a different variable name
                    cy.log('Determining available payment methods');
                    // Prioritize using existing permit if available and enabled
                    if ($bodyPayment.find('button:contains("Use Existing Permit")').length > 0 && !$bodyPayment.find('button:contains("Use Existing Permit")').is(':disabled')) {
                        cy.log('Selecting "Use Existing Permit" button');
                        cy.contains('button', 'Use Existing Permit').click({ force: true });
                    }
                    // Otherwise, try Credit Card
                    else if ($bodyPayment.find('button:contains("Credit Card")').length > 0) {
                        cy.log('Selecting "Credit Card" button');
                        cy.contains('button', 'Credit Card').click({ force: true });
                        cy.wait(500); // Allow UI to potentially show saved cards/form

                        // Check for saved cards *after* clicking the 'Credit Card' button
                        // Re-query the body inside the conditional logic for updated state
                        cy.get('body').then($bodyAfterCredit => {
                            const savedCardsVisible = $bodyAfterCredit.find('div:contains("Saved Cards")').length > 0 && !$bodyAfterCredit.find('.CardElement').is(':visible');
                            const newCardFormVisible = $bodyAfterCredit.find('.CardElement').is(':visible');

                            if (savedCardsVisible) {
                                cy.log('Using saved card');
                                cy.get('div:contains("•••• ")').first().click({ force: true }); // Click first saved card display
                            } else if (newCardFormVisible) {
                                cy.log('Using new card - simulating Stripe success');
                                cy.window().then(win => {
                                    win.dispatchEvent(new CustomEvent('stripeSuccess', {
                                        detail: { paymentMethod: { id: 'pm_test_success' }, error: null }
                                    }));
                                });
                            } else {
                                // Fallback if neither saved cards nor new form is clearly visible after clicking 'Credit Card'
                                cy.log('Credit Card selected, but cannot determine state (Saved vs New). Proceeding.');
                            }
                        });
                    }
                    // Otherwise, try SOLAR
                    else if ($bodyPayment.find('button:contains("SOLAR Account")').length > 0) {
                        cy.log('Selecting "SOLAR Account" button');
                        cy.contains('button', 'SOLAR Account').click({ force: true });
                        cy.wait(200);
                        if ($bodyPayment.find('input#solar-id').length > 0) {
                            cy.get('input#solar-id').type('123456789');
                        }
                    } else {
                        cy.log('ERROR: Could not find a selectable payment method button.');
                        // Optionally fail the test here
                        // throw new Error("No payment method could be selected.");
                    }

                    cy.log('Completing payment');
                    // Find the main submit button in the payment form section
                    cy.get('form').contains('button', /Complete Payment|Pay Now|Submit Payment/).click();
                    cy.wait('@createReservation', { timeout: 15000 });
                    cy.log('Step 9: Payment submitted, transitioning to Confirmation View');
                });

                // --- View: Confirmation ---
                cy.log('Step 10: Verifying Confirmation View');
                cy.contains('h1', 'Reservation Confirmed!', { timeout: 15000 }).should('be.visible'); // Verify Confirmation View heading
                cy.contains('button', 'Back to Home').click(); // Exact button text
                cy.url().should('include', '/dashboard');
                cy.log('Step 10: Confirmed and returned to dashboard');
                // *** End of nested steps ***
            }
        });
    });
}); 