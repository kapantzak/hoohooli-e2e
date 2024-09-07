/// <reference types="cypress" />

describe("Home page", () => {
  const baseUrl = Cypress.env("baseUrl");

  context("Request checks", () => {
    it("gets 200 response", () => {
      cy.request(Cypress.env("baseUrl")).its("status").should("eq", 200);
    });
  });

  context("With visit", () => {
    beforeEach(() => {
      cy.visit(baseUrl);
    });

    it("displays main header", () => {
      cy.get(".uagb-ifb-title")
        .first()
        .should("have.text", "Βρεφικά και παιδικά είδη");
    });
  });
});
