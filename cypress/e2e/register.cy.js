describe('User Registration', () => {
    // Load the users fixture before each test
    beforeEach(() => {
        cy.fixture('users').as('users');
    });

    it('should register a new user and be approved by admin', function () {
        // Generate a unique email with timestamp to avoid conflicts
        const timestamp = new Date().getTime();
        const uniqueEmail = `testuser_${timestamp}@example.com`;

        // Create fresh user data with unique values
        const freshUser = {
            firstName: "Test",
            lastName: `User_${timestamp}`,
            email: uniqueEmail,
            password: "password123",
            sbuId: `${Math.floor(10000000 + Math.random() * 90000000)}`, // 8-digit random number
            userType: "student"
        };

        // Visit registration page
        cy.visit('/register');

        // Fill out registration form with the fresh user data
        cy.get('#firstName').type(freshUser.firstName);
        cy.get('#lastName').type(freshUser.lastName);
        cy.get('#email').type(freshUser.email);
        cy.get('#password').type(freshUser.password);
        cy.get('#confirmPassword').type(freshUser.password);
        cy.get('#sbuId').type(freshUser.sbuId);
        cy.get('#userType').select(freshUser.userType);

        // Submit registration form
        cy.get('button[id="create account"]').click();

        // Wait for registration to complete and redirect
        cy.wait(2000);

        // Check redirect to login page
        cy.url().should('include', '/login');

        // Verify success message is displayed
        cy.contains('Registration successful').should('be.visible');

        // Now login as admin to approve the new user
        const admin = this.users.admin;

        // Login as admin
        cy.visit('/login');
        cy.get('#email-address').clear().type(admin.email);
        cy.get('#password').clear().type(admin.password, { log: false });
        cy.get('button[id="login button"]').click();

        // Wait for admin dashboard to load
        cy.wait(2000);
        cy.url({ timeout: 10000 }).should('include', '/admin-dashboard');

        // Pending Approvals section should be visible on the admin dashboard
        cy.contains('Pending Approvals', { timeout: 10000 }).should('be.visible');

        // Find the row with the newly registered user by email and approve
        cy.contains(freshUser.email)
            .closest('tr')
            .within(() => {
                cy.contains('Approve').click();
            });

        // Verify approval success message
        cy.contains('User approved successfully').should('be.visible');

        // Logout from admin account through the profile dropdown in navbar
        // First click on profile button in the navbar (user avatar/button)
        cy.get('button[id="profile-button"]').click();

        // Then click the "Sign out" option in the dropdown menu
        cy.contains('Sign out').click();

        // Verify redirect to login page
        cy.url().should('include', '/login');
    });

    it('should validate required fields during registration', function () {
        // Visit registration page
        cy.visit('/register');

        // Submit empty form
        cy.get('button[id="create account"]').click();

        // Check for validation errors
        cy.contains('First name is required').should('be.visible');
        cy.contains('Last name is required').should('be.visible');
        cy.contains('Email is required').should('be.visible');
        cy.contains('Password is required').should('be.visible');
        cy.contains('SBU ID is required').should('be.visible');
    });

    it('should validate password confirmation match', function () {
        // Visit registration page
        cy.visit('/register');

        // Fill out form with mismatched passwords
        cy.get('#firstName').type('Test');
        cy.get('#lastName').type('User');
        cy.get('#email').type('mismatch@example.com');
        cy.get('#password').type('password123');
        cy.get('#confirmPassword').type('password456');
        cy.get('#sbuId').type('123456789');
        cy.get('#userType').select('student');

        // Submit form
        cy.get('button[id="create account"]').click();

        // Check for password mismatch error
        cy.contains('Passwords do not match').should('be.visible');
    });
});