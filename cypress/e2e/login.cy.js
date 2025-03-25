describe('User Login', () => {
    beforeEach(() => {
        cy.fixture('users').as('users');
    });
  
    it('should login with valid credentials', function() {
        const currentUser = this.users.validUser;
        cy.login(currentUser.email, currentUser.password);
        cy.url({timeout: 10000}).should("eq",'http://localhost:5173/dashboard');
    });
  
    it('should show error for invalid credentials', function() {
        const invalid = this.users.invalidUser;
        cy.login(invalid.email, invalid.password);
        cy.url({timeout:10000}).get('#error-msg', {timeout:2000}).should('not.include', 'Error:');
    });
  });