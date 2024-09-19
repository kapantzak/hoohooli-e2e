/// <reference types="cypress" />

describe("Page request", () => {
  const baseUrl = Cypress.env("baseUrl");

  [
    {
      url: baseUrl,
      page: "",
      status: 200,
    },
    {
      url: `${baseUrl}/shop`,
      page: "shop",
      status: 200,
    },
    {
      url: `${baseUrl}/blog`,
      page: "blog",
      status: 200,
    },
    {
      url: `${baseUrl}/about`,
      page: "about",
      status: 200,
    },
    {
      url: `${baseUrl}/contact`,
      page: "contact",
      status: 200,
    },
    {
      url: `${baseUrl}/undefined`,
      page: "undefined",
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
