describe('Initial Reservation', () => {
  let user;
  before(() => {
    user = Cypress.env('user');
  });

  it('initial user reserved successfully', function () {
    cy.intercept('GET', '/dashboard').as('dashboardLoad');
    cy.intercept('GET', '/find-parking').as('findParking');

    // insert the first user for reservation here
    cy.visit('/login');
    cy.get('#email-address').clear().type(user.email);
    cy.get('#password').clear().type(user.password, { log: false });
    cy.get('button[id="login button"]').click();

    cy.wait('@dashboardLoad');
    cy.url({ timeout: 10000 }).should('include', '/dashboard');

    // Navigate to Find Parking to begin reservation process
    cy.contains('Find Parking').click();
    cy.wait('@findParking');

    cy.get("input[name='address']").clear().type('Ammann College');
    cy.get("input[id='date']").clear().type('05022025');
    cy.get("input[id='startTime']").clear().type('300pm');
    cy.get("input[id='endTime']").clear().type('400pm');
    cy.get('button').contains('Search for Parking').click();

    // find lot 6B and reserve it
    cy.get("div[class='rounded-lg transition-all duration-200 cursor-pointer overflow-hidden shadow-sm']").contains("Lot 3").get(button).contains("View Details").click();
    cy.get('button').contains('Proceed to Payment').click();

    //car details
    cy.get("input[id='plateNumber]").clear().type('ABC123');
    cy.get("select[id='state]").clear().type('NY').type('{enter}');
    cy.get("select[id='make]").clear().type('Volkswagen').type('{enter}');
    cy.get("select[id='model]").clear().type('Tiguan').type('{enter}');
    cy.get("select[id='color]").clear().type('Brown').type('{enter}');
    cy.get("select[id='bodyType]").clear().type('SUV').type('{enter}');
    cy.get('button').contains('Continue to Payment').click();

    //payment details using dummy card
    cy.get('div').contains('Card Number').clear().type('4242424242424242013011111747');
    cy.get('button').contains('Pay').click();

    //check if reservation went through
    cy.get("h1[class='text-2xl font-bold text-gray-900']").should('contain', 'Reservation Confirmed!');
  });
});