/// <reference types="cypress" />

describe("Home page", () => {
  const baseUrl = Cypress.env("baseUrl");

  beforeEach(() => {
    cy.visit(baseUrl);
  });

  it("renders main header", () => {
    cy.get(".uagb-ifb-title")
      .first()
      .should("have.text", "Βρεφικά και παιδικά είδη");
  });

  it("renders the main 'Shop' button", () => {
    cy.get(".uagb-infobox-cta-link")
      .first()
      .should("have.text", "Αγοράστε τώρα");
  });
});
