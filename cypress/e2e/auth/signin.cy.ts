describe('authentication', () => {
  beforeEach(() => {
    cy.visit('/signin');

    // hide the cookie banner
    cy.get('button').contains('Allow').click();
  });

  it('displays the magic link by default', () => {
    cy.get('input[type="email"]').should('have.length', 1);
    cy.get('input[type="password"]').should('have.length', 0);
    cy.get('button[type="submit"]').should('have.length', 1);
  });

  it('displays the password form when the user switches to password mode', () => {
    cy.get('button').contains('Password').click();
    cy.get('input[type="email"]').should('have.length', 1);
    cy.get('input[type="password"]').should('have.length', 1);
    cy.get('button[type="submit"]').should('have.length', 1);
  });
});
