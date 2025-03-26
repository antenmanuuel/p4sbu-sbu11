describe('User Login', () => {
    beforeEach(() => {
        cy.fixture('users').as('users');
    });

    it('should login with valid student credentials', function () {
        const currentUser = this.users.validUser;

        cy.intercept('GET', '/dashboard').as('dashboardLoad');

        // Visit login page
        cy.visit('/login');

        // Enter valid credentials
        cy.get('#email-address').clear().type(currentUser.email);
        cy.get('#password').clear().type(currentUser.password, { log: false });

        // Click login button
        cy.get('button[id="login button"]').click();

        // Wait for loading state or API response
        cy.wait('@dashboardLoad');

        // Check redirect to dashboard with a longer timeout
        cy.url({ timeout: 10000 }).should('include', '/dashboard');
    });

    it('should login with valid admin credentials', function () {
        const admin = this.users.admin;

        cy.intercept('GET', '/admin-dashboard').as('adminDashboard');

        // Visit login page
        cy.visit('/login');

        // Enter admin credentials
        cy.get('#email-address').clear().type(admin.email);
        cy.get('#password').clear().type(admin.password, { log: false });

        // Click login button
        cy.get('button[id="login button"]').click();

        // Wait for loading state or API response
        cy.wait('@adminDashboard');

        // Check redirect to admin-dashboard with a longer timeout
        cy.url({ timeout: 10000 }).should('include', '/admin-dashboard');
    });

    it('should show error for invalid credentials', function () {
        const invalid = this.users.invalidUser;

        // Visit login page
        cy.visit('/login');

        // Enter invalid credentials
        cy.get('#email-address').clear().type(invalid.email);
        cy.get('#password').clear().type(invalid.password, { log: false });

        // Click login button
        cy.get('button[id="login button"]').click();

        // Wait for error response
        cy.wait(1000);

        // Check for error message
        cy.get('[id="error-msg"]').should('exist');
        cy.contains('Error:').should('be.visible');
    });

    it('should validate required fields', function () {
        // Visit login page
        cy.visit('/login');

        // Submit empty form
        cy.get('button[id="login button"]').click();

        // Check for validation errors
        cy.contains('Email is required').should('be.visible');
        cy.contains('Password is required').should('be.visible');
    });

    it('should check password length validation', function () {
        // Visit login page
        cy.visit('/login');

        // Enter valid email but short password
        cy.get('#email-address').clear().type('test@example.com');
        cy.get('#password').clear().type('short');

        // Submit the form
        cy.get('button[id="login button"]').click();

        // Check for password validation error
        cy.contains('Password must be at least 8 characters').should('be.visible');
    });

    it('should validate email format', function () {
        // Visit login page
        cy.visit('/login');

        // Enter invalid email format
        cy.get('#email-address').clear().type('invalid-email');
        cy.get('#password').clear().type('password123');

        // Submit the form
        cy.get('button[id="login button"]').click();

        // Check for email validation error
        cy.contains('Email is invalid').should('be.visible');
    });
});