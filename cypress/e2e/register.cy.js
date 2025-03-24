describe('User Registration', () => {
    //load the users before registration tests
    beforeEach(()=>{
        cy.fixture('users').as('users');
    });

    // successfully registering new user test
    it('register new user successfully', function() {
        const currentUser = this.users.validUser;
        cy.register(currentUser.firstName, currentUser.lastName, currentUser.email, currentUser.password, currentUser.sbuId, currentUser.userType);
        cy.contains().should(); //Anything visible after successful user registration?
    });

    // throw error when a duplicate user tries to register
    it('show error for duplicate user', () => {
        const currentUser = this.users.validUser;
        cy.register(currentUser.firstName, currentUser.lastName, currentUser.email, currentUser.password, currentUser.sbuId, currentUser.userType);
        cy.contains().should(); //Anything visible during duplicate user registration?
    });
});