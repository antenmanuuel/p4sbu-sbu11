describe('Edit Permit Status', ()=>{
    beforeEach(() => {
        cy.fixture('users').as('users');
    });

    it('toggled status successfully', function(){
        const admin = this.users.admin;
        cy.login(admin.email, admin.password);
        cy.get('tbody tr').eq(0).get('td').eq(7).invoke('text').then((oldStatus)=>{
            cy.togglePaidStatus();
            cy.get('tbody tr').eq(0).get('td').eq(7).invoke('text').should('not.equal', oldStatus);
        });
    });

    it('toggled payment successfully', function(){
        const admin = this.users.admin;
        cy.login(admin.email, admin.password);
        cy.get('tbody tr').eq(0).get('td').eq(8).invoke('text').then((oldStatus)=>{
            cy.togglePaidStatus();
            cy.get('tbody tr').eq(0).get('td').eq(8).invoke('text').should('not.equal', oldStatus);
        });
    });
});