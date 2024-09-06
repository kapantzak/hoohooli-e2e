/// <reference types="cypress" />

describe("Home page", () => {
  beforeEach(() => {
    cy.visit("https://hoohooli.gr");
  });

  it("displays main header", () => {
    cy.get(".uagb-ifb-title")
      .first()
      .should("have.text", "Βρεφικά και παιδικά είδη");
  });
});
