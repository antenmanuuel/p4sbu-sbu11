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

    cy.get('button[id="create account"]', {timeout: 2000}).click();
});

// login command
Cypress.Commands.add('login', (email, password) => {
    cy.visit('http://localhost:5173/login');
    cy.get('#email-address').type(email);
    cy.get('#password').type(password);
    cy.get('button[id="login button"]', {timeout:2000}).click();
});

// login and edit a lot based on given "visible" changes
Cypress.Commands.add('editLot', (changedLot)=>{
    cy.get('div[id="manage lots"]').click();

    cy.get('button[title="Edit Lot"]').click();
    cy.get('input[name="name"]').invoke('value', '').type(changedLot.name); //change name
    cy.get('input[name="address"]').invoke('value', '').type(changedLot.address); //change address
    cy.get('input[name="latitude"]').invoke('value', '').type(changedLot.location.latitude).get('input[name="longitude"]').invoke('value', '').type(changedLot.location.longitude); //change longitude and latitude
    cy.get('input[name="totalSpaces"]').invoke('value', '').type(changedLot.totalSpaces).get('input[name="availableSpaces"]').invoke('value', '').type(changedLot.availableSpaces); //change total spaces and available spaces
    cy.get('button[id="save changes"]', {timeout:2000}).click();
});

// toggle active and inactive
Cypress.Commands.add('toggleLot', ()=>{
    cy.get('div[id="manage lots"]').click();

    cy.get('tbody tr').eq(0).get('td').eq(5).get('button[id="active button"]').click();
    cy.get('button[id="active button"]').click(); // click toggle button
});

// login and delete lot

// edit permit

// toggle paid, refunded, and unpaid
Cypress.Commands.add('togglePaidStatus', ()=>{
    cy.get('div[id="manage permits"]').click();

    cy.get('tbody tr').eq(0).get('td').eq(9).get('button[id="toggle status button"]').click();
});

// toggle active/inactive
Cypress.Commands.add('toggleActive', ()=>{
    cy.get('div[id="manage permits"]').click();

    cy.get('tbody tr').eq(0).get('td').eq(9).get('button[id="toggle payment button"]').click();
});

// delete permit