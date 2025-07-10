describe('Edit Lot Information', ()=>{
    beforeEach(() => {
        cy.fixture('users').as('users');
        cy.fixture('lots').as('lots');
    });

    it('edited lot successfully', function() {
        const admin = this.users.admin;
        const changed = this.lots.changedLot;
        cy.login(admin.email, admin.password);
        cy.editLot(changed);
        cy.wait(5000);
        const row = cy.url().get('tbody tr', {timeout:2000}).eq(0);
        row.get('td').eq(0).contains(changed.name);
        row.get('td').eq(1).contains(changed.address);
        row.get('td').eq(2).contains(changed.totalSpaces).contains(changed.availableSpaces);
    });

    it('toggled lot successfully', function() {
        const admin = this.users.admin;
        cy.login(admin.email, admin.password);
        cy.wait(5000);
        cy.url().get('tbody tr').eq(0).get('td').eq(4).invoke('text').then((oldStatus)=>{
            cy.toggleLot();
            cy.get('tbody tr').eq(0).get('td').eq(4).invoke('text').should('not.equal', oldStatus);
        });
    });
});