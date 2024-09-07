/// <reference types="cypress" />

describe("Navigation", () => {
  const baseUrl = Cypress.env("baseUrl");

  beforeEach(() => {
    cy.visit(baseUrl);
  });

  describe("Main menu", () => {
    describe("Shop menu", () => {
      it("navigates to /shop page", () => {
        cy.get("#menu-item-2263 > a").click();
        cy.url().should("include", "/shop");
      });
    });

    describe("Blog menu", () => {
      it("navigates to /blog page", () => {
        cy.get("#menu-item-2264 > a").click();
        cy.url().should("include", "/blog");
      });
    });

    describe("About menu", () => {
      it("navigates to /about page", () => {
        cy.get("#menu-item-1044 > a").click();
        cy.url().should("include", "/about");
      });
    });

    describe("Contact menu", () => {
      it("navigates to /contact page", () => {
        cy.get("#menu-item-1045 > a").click();
        cy.url().should("include", "/contact");
      });
    });
  });
});
