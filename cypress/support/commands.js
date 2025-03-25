// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// register command
Cypress.Commands.add('register', (firstName, lastName, email, password, sbuId, userType) => {
    cy.visit('http://localhost:5173/register');

    cy.get('#firstName').type(firstName);
    cy.get('#lastName').type(lastName);
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('#confirmPassword').type(password);
    cy.get('#sbuId').type(sbuId);
    cy.get('#userType').type(userType);

    cy.get('button[type="submit]').click();
});

// login command
Cypress.Commands.add('login', (email, password) => {
    cy.visit('http://localhost:5173/login');
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('button[type="submit"]').click();
});

// login and edit a lot based on given "visible" changes
Cypress.Commands.add('editLot', (email, password, changedLot)=>{
    cy.visit('http://localhost:5173/login');
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('button[type="submit"]').click();
    cy.get('button[title="Edit Lot"]').click();
    cy.get().type(changedLot.name); //change name
    cy.get().type(changedLot.address); //change address
    cy.get().type(changedLot.location.latitude).get().type(changedLot.location.longitude); //change longitude and latitude
    cy.get().type(changedLot.totalSpaces).get().type(changedLot.availableSpaces); //change total spaces and available spaces
    cy.get().click().get().click(changedLot.rateType); //change rate
});

// toggle active and inactive
Cypress.Commands.add('toggleLot', (email, password, currentLot)=>{
    cy.visit('http://localhost:5173/login');
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('button[type="submit"]').click();
    cy.get().click(); // click toggle button
});

// login and delete lot