# Hoohooli.gr - E2E

This project runs end-to-end tests against [https://hoohooli.gr](https://hoohooli.gr) using [Playwright](https://playwright.dev/).

## Setup

```bash
npm install
npx playwright install --with-deps chromium firefox webkit
cp .env.example .env
```

## Environment variables

- `BASE_URL`: the base URL of the site under test (default in `.env.example`: `https://hoohooli.gr`)

## Running tests

```bash
npm test          # run the full suite headless, all browsers
npm run test:ui   # run in Playwright's interactive UI mode
npm run report    # open the last HTML report
```

## Project structure

- `pages/` — Page Object Model classes (one per page/component)
- `tests/` — Playwright spec files
- `playwright.config.ts` — browser projects, retries, trace/video/screenshot settings

## CI

`.github/workflows/e2e.yml` runs the suite daily at 01:00 UTC and on manual dispatch, against the `Production` GitHub Actions environment. On failure, it emails a notification and uploads the Playwright HTML report as a build artifact.
