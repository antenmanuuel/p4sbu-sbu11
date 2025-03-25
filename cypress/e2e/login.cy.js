describe('User Login', () => {
    beforeEach(() => {
        cy.fixture('users').as('users');
    });
  
    it('should login with valid credentials', function() {
        const currentUser = this.users.validUser;
        cy.login(currentUser.email, currentUser.password);
        cy.wait(5000);
        cy.url().should("eq",'http://localhost:5173/dashboard');
    });
  
    it('should show error for invalid credentials', function() {
        const invalid = this.users.invalidUser;
        cy.login(invalid.email, invalid.password);
        cy.wait(5000);
        cy.url().get('#error-msg').should('not.include', 'Error:');
    });
  });