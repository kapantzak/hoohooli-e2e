# Hoohooli.gr - E2E

This is a project that performs e2e test on [https://hoohooli.gr](https://hoohooli.gr).

## Environment variables

- `BASE_URL`: The base url of the site
- `PRODUCT_PATH`: The product to add to cart
- `PRODUCT_PRICE`: Current product price that is checked by the e2e test

Use the above variable on a local `.env` file with the `CYPRESS_` prefix, like this:

```
CYPRESS_BASE_URL=https://hoohooli.gr
CYPRESS_PRODUCT_PATH=/shop/accessories/scrunchies/scrunchie-10
CYPRESS_PRODUCT_PRICE=4,00
```
