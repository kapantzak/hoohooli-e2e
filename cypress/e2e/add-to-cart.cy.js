/// <reference types="cypress" />

describe("Add to cart and checkout", () => {
  const baseUrl = Cypress.env("baseUrl");
  const productPath = Cypress.env("productPath");
  const productPrice = Cypress.env("productPrice");

  it("adds specific product to cart and proceed to checkout", () => {
    Cypress.on("uncaught:exception", (err) => {
      if (
        err.message.includes("Cannot read properties of null (reading 'name')")
      ) {
        return false;
      }
      return true;
    });

    cy.visit(`${baseUrl}${productPath}`);
    cy.get("button[name='add-to-cart']").first().click();
    cy.get(".woocommerce-message").should(
      "contain",
      "έχει προστεθεί στο καλάθι σας."
    );
    cy.get("a").contains("Καλάθι").click();
    cy.get(".woocommerce-cart-form__cart-item.cart_item").should(
      "have.length",
      1
    );
    cy.get("tr.cart-subtotal > td bdi").contains(productPrice);
    cy.get("a.checkout-button").click();
    cy.get(".entry-title").contains("Ολοκλήρωση αγοράς");
    cy.get("tr.cart-subtotal > td bdi").contains(productPrice);
  });
});
