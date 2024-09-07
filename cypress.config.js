const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://hoohooli.gr",
    env: {
      baseUrl: "https://hoohooli.gr",
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
