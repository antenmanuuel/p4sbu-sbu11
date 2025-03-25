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
        const current = this.lots.currentLot;
        cy.editLot(admin.email, admin.password, current);
        cy.contains.should();
    });
});