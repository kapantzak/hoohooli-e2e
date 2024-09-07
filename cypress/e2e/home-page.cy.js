/// <reference types="cypress" />

describe("Home page", () => {
  const baseUrl = Cypress.env("baseUrl");

  context("Request checks", () => {
    [
      {
        url: `${Cypress.env("baseUrl")}`,
        page: "",
        status: 200,
      },
      {
        url: `${Cypress.env("baseUrl")}/shop`,
        page: "shop",
        status: 200,
      },
      {
        url: `${Cypress.env("baseUrl")}/blog`,
        page: "blog",
        status: 200,
      },
      {
        url: `${Cypress.env("baseUrl")}/about`,
        page: "about",
        status: 200,
      },
      {
        url: `${Cypress.env("baseUrl")}/contacts`,
        page: "contact",
        status: 200,
      },
      {
        url: `${Cypress.env("baseUrl")}/foo`,
        page: "foo",
        status: 404,
      },
    ].forEach(({ url, page, status }) => {
      it(`/${page} returns ${status}`, () => {
        cy.request({
          url,
          failOnStatusCode: false,
        })
          .its("status")
          .should("eq", status);
      });
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
