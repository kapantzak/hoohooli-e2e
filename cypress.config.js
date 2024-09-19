const { defineConfig } = require("cypress");
require("dotenv").config();

module.exports = defineConfig({
  e2e: {
    env: {
      baseUrl: process.env.CYPRESS_BASE_URL,
      productPath: process.env.CYPRESS_PRODUCT_PATH,
      productPrice: process.env.CYPRESS_PRODUCT_PRICE,
    },
  },
});
