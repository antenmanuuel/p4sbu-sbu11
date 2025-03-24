describe('User Login', () => {
    beforeEach(() => {
        cy.fixture('users').as('users');
    });
  
    it('should login with valid credentials', function() {
        const currentUser = this.users.validUser;
        cy.login(currentUser.email, currentUser.password);
        cy.contains().should();
    });
  
    it('should show error for invalid credentials', function() {
        const invalid = this.users.invalidUser;
        cy.login(invalid.email, invalid.password);
        cy.contains().should();
    });
  });