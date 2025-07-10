describe('Permit Management Tests', () => {
    beforeEach(() => {
        cy.fixture('users').as('users');
    });

    describe('Edit Permit Status', () => {
        it('toggled status successfully', function () {
            cy.intercept('GET', '/admin-dashboard').as('adminDashboardLoad');
            cy.intercept('GET', '/manage-permits').as('managePermits');

            const admin = this.users.admin;
            cy.visit('/login');
            cy.get('#email-address').clear().type(admin.email);
            cy.get('#password').clear().type(admin.password, { log: false });
            cy.get('button[id="login button"]').click();

            cy.wait('@adminDashboardLoad');
            cy.url({ timeout: 10000 }).should('include', '/admin-dashboard');

            // Navigate to Manage Permits by clicking the Active Permits card
            cy.contains('Active Permits').click();
            cy.wait('@managePermits');

            // Get the old status from the first permit in the list
            cy.get('tbody tr').eq(0).find('td').eq(7).invoke('text').then((oldStatus) => {
                // Click the toggle status button
                cy.get('tbody tr').eq(0).find('button[id="toggle status button"]').click();
                cy.wait(1000);

                // Check the status has changed
                cy.get('tbody tr').eq(0).find('td').eq(7).invoke('text').should('not.equal', oldStatus);
            });
        });

        it('toggled payment successfully', function () {
            const admin = this.users.admin;
            cy.visit('/login');
            cy.get('#email-address').clear().type(admin.email);
            cy.get('#password').clear().type(admin.password, { log: false });
            cy.get('button[id="login button"]').click();

            cy.wait(2000);
            cy.url({ timeout: 10000 }).should('include', '/admin-dashboard');

            // Navigate to Manage Permits by clicking the Active Permits card
            cy.contains('Active Permits').click();
            cy.wait(1000);

            // Get the old payment status from the first permit in the list
            cy.get('tbody tr').eq(0).find('td').eq(8).invoke('text').then((oldStatus) => {
                // Click the toggle payment button
                cy.get('tbody tr').eq(0).find('button[id="toggle payment button"]').click();
                cy.wait(1000);

                // Check the payment status has changed
                cy.get('tbody tr').eq(0).find('td').eq(8).invoke('text').should('not.equal', oldStatus);
            });
        });
    });
});