describe('Edit Lot Information', ()=>{
    beforeEach(() => {
        cy.fixture('users').as('users');
        cy.fixture('lots').as('lots');
    });

    it('edited lot successfully', function() {
        const admin = this.users.admin;
        const changed = this.lots.changedLot;
        cy.editLot(admin.email, admin.password, changed);
        cy.contains.should();
    });

    it('toggled lot successfully', function() {
        const admin = this.users.admin;
        cy.login(admin.email, admin.password);
        cy.get('tbody tr').eq(0).get('td').eq(4).invoke('text').then((oldStatus)=>{
            cy.toggleLot();
            cy.get('tbody tr').eq(0).get('td').eq(4).invoke('text').should('not.equal', oldStatus);
        });
    });
});