/// <reference types="cypress" />

describe("Add to cart", () => {
  const baseUrl = Cypress.env("baseUrl");
  const productPath = Cypress.env("productPath");

  it("adds specific product to cart", () => {
    Cypress.on("uncaught:exception", (err) => {
      if (
        err.message.includes("Cannot read properties of null (reading 'name')")
      ) {
        return false;
      }
      return true;
    });

    cy.visit(`${baseUrl}${productPath}`);
  });
});
