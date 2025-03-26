describe('login', (email, password)=>{
    // Visit login page
    cy.visit('/login');

    // Enter valid credentials
    cy.get('#email-address').clear().type(email);
    cy.get('#password').clear().type(password, { log: false });

    // Click login button
    cy.get('button[id="login button"]').click();

    // Wait for loading state or API response
    cy.wait(2000);
});