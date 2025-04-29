describe('Consequent Reservations', () => {  
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
  
      // 6B should not be available because it is full
      cy.get("div[class='rounded-lg transition-all duration-200 cursor-pointer overflow-hidden shadow-sm']").contains("Lot 3").should('not.exist');
    });
  });