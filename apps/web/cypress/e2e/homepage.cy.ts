describe("homepage", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  describe("navigation", () => {
    it("should have all navigation links", () => {
      const nav = cy.get("nav");
      nav.should("exist");

      const pricingLink = nav.get('a[href="/en/pricing"]');
      pricingLink.should("exist");
      pricingLink.should("contain", "Pricing");

      const blogLink = nav.get('a[href="/en/blog"]');
      blogLink.should("exist");
      blogLink.should("contain", "Blog");
    });
  });

  describe("banner", () => {
    it("should show banner on initial load", () => {
      const banner = cy.get('[data-test="banner"]');
      banner.should("exist");
      banner.should(
        "contain",
        "New: In this banner you can show your awesome new feature",
      );
    });

    it("should be closable", () => {
      const banner = cy.get('[data-test="banner"]');
      const closeButton = cy.get('[data-test="banner"] button');
      closeButton.should("exist");
      closeButton.click();

      banner.should("not.exist");
    });
  });

  describe("dark mode", () => {
    it("should have a color mode toggle", () => {
      cy.get('[data-test="color-mode-toggle"]').should("exist");
    });

    it("should toggle to light mode if selected", () => {
      cy.get('[data-test="color-mode-toggle"]').click();
      cy.get('[data-test="color-mode-toggle-item-light"]').click();

      cy.get("html").should("have.class", "light");
    });

    it("should toggle to dark mode if selected", () => {
      cy.get('[data-test="color-mode-toggle"]').click();
      cy.get('[data-test="color-mode-toggle-item-dark"]').click();

      cy.get("html").should("have.class", "dark");
    });
  });

  describe("progress-bar", () => {
    it("should show progress bar when navigating to different page", () => {
      cy.get('[data-test="progress-bar"]').should("not.exist");

      cy.get('nav a[href="/en/pricing"]').click();
      cy.get("#nprogress").should("exist");
    });
  });
});
