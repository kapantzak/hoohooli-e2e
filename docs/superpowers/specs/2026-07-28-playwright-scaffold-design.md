# Playwright E2E Scaffold — Design

Date: 2026-07-28
Status: Approved

## Context

`hoohooli-e2e` previously held a Cypress test suite against the WordPress/WooCommerce
version of https://hoohooli.gr (page-status checks, home page rendering, nav links,
add-to-cart/checkout). That content was removed (see `erase-contents` branch, PR #1)
because hoohooli.gr has since been rebuilt on Next.js — the old CSS-class selectors
(`.uagb-*`, WooCommerce classes, WordPress menu-item IDs) no longer apply, and the
site's routes/structure have changed.

This spec covers scaffolding a brand new Playwright project from scratch, scoped to
what can currently be verified against the live Next.js site: the home page and its
cookie consent banner. Further test coverage (other pages, cart/checkout) is explicit
future work once those flows exist on the new site.

## Goals

- Stand up a working Playwright + TypeScript project structure using the Page Object
  Model, ready to extend with more specs later.
- Cover, with tests grounded in observed real site behavior (not guessed selectors):
  - Home page renders correctly (title, main heading).
  - Cookie consent banner: Accept All, Reject, and the Settings modal (Save with
    Analytics on/off, and Back-without-saving).
- Recreate the old CI workflow's operational behavior (daily scheduled run, manual
  dispatch, failure email notification, artifact upload on failure) on Playwright,
  without polluting production Google Analytics data from automated runs.

## Non-goals (deferred)

- Page-status checks across routes (old `basic.cy.js`) — site routes changed, needs
  re-discovery of current routes.
- Navigation/menu tests — old selectors were WordPress menu-item IDs, no longer valid.
- Add-to-cart / checkout flow — depends on the new site's current product/cart
  implementation; will need its own probe-and-design pass like this one.
- Cross-browser visual regression / accessibility audits — not requested.

## Verified site behavior (evidence)

Captured by fetching https://hoohooli.gr live and running a throwaway Playwright probe
script (see conversation; script discarded, not part of this repo):

- Title: `hoohooli — Χειροποίητα για Μωρά & Παιδιά`
- Home `<h1>`: "Χειροποίητα με Αγάπη, για Κάθε Παιδί" (no test-id; plain heading)
- Cookie banner: fixed bottom-of-viewport panel, no `role`/`aria-label`/test-id,
  three buttons identified by visible text: **"Αποδοχή Όλων"** (Accept All),
  **"Απόρριψη"** (Reject), **"Ρυθμίσεις"** (Settings)
- **Accept All** → `localStorage["hoohooli-cookie-consent"] = {"analytics":true}`,
  sets real GA cookies (`_ga`, `_ga_*`), banner dismissed permanently (survives reload)
- **Reject** → `localStorage["hoohooli-cookie-consent"] = {"analytics":false}`, no GA
  cookies set, banner dismissed permanently
- **Settings** click opens a modal titled "Ρυθμίσεις Cookies" containing:
  - "Απαραίτητα" (Necessary) checkbox — checked and disabled
  - "Στατιστικά" (Analytics) checkbox — unchecked by default
  - "Αποθήκευση Επιλογών" (Save) button, "Πίσω" (Back) button
  - Save with Analytics left off → identical end-state to Reject
  - Save with Analytics toggled on → identical end-state to Accept All (GA cookies set)
  - Back (no save) → no state persisted; banner reappears on reload

**Risk noted and addressed:** the "enable analytics" paths (Accept All, and
Settings→enable→Save) cause the browser to register a real GA hit. Since the suite
runs daily against production via a cron job indefinitely, those specific tests block
network requests to `google-analytics.com` / `googletagmanager.com` before triggering
the action, so we assert on the resulting cookie/localStorage state without injecting
synthetic sessions into real analytics data.

## Project structure

```
playwright.config.ts
package.json
tsconfig.json
.env.example
.gitignore
pages/
  base-page.ts             # shared navigation helper(s)
  home-page.ts             # heading(), cookie banner locators/actions
  cookie-settings-modal.ts # Settings modal locators/actions
tests/
  home.spec.ts              # title + heading render check
  cookie-consent.spec.ts    # banner + settings modal interactions
.github/workflows/
  e2e.yml
README.md
```

## Configuration

- **Language:** TypeScript (Playwright's native, zero-build-step support).
- **Browsers:** chromium, firefox, webkit (all three Playwright projects).
- **`playwright.config.ts`:**
  - Loads `.env` via `dotenv`; `use.baseURL` set from `process.env.BASE_URL`.
  - `retries: 2` when `process.env.CI` is set, `0` locally.
  - `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`,
    `trace: 'on-first-retry'`.
- **Env vars:** `BASE_URL` only for now (no `CYPRESS_`-style prefix needed).
  `PRODUCT_PATH` / `PRODUCT_PRICE` will be reintroduced when an add-to-cart spec is
  designed.

## Page Objects

- `pages/home-page.ts`:
  - `goto()`, `heading()`
  - `acceptAllButton()`, `rejectButton()`, `settingsButton()`
  - `acceptAllCookies()`, `rejectCookies()`
  - `openCookieSettings()` → returns `CookieSettingsModal`
- `pages/cookie-settings-modal.ts`:
  - `necessaryCheckbox()`, `analyticsCheckbox()`, `saveButton()`, `backButton()`
  - `save()`, `goBack()`

## Tests

**`tests/home.spec.ts`**
1. Home page has the expected title and renders the main heading.
2. Cookie consent banner is visible with all three actions present.

**`tests/cookie-consent.spec.ts`**
1. Accept All dismisses the banner and persists analytics consent (GA request
   blocked; asserts on `localStorage`/cookie state, banner stays hidden after reload).
2. Reject dismisses the banner without granting analytics (no GA cookies, banner
   stays hidden after reload).
3. Settings → Save with Analytics left off behaves like Reject.
4. Settings → enable Analytics → Save behaves like Accept All (GA request blocked).
5. Settings → Back discards the choice (banner reappears after reload).

## CI workflow

`.github/workflows/e2e.yml` replaces the old `e2e.yml` (and drops the old debug
`test.yml`, which was never part of the real suite):

- Triggers: `workflow_dispatch` + daily `schedule` (`0 1 * * *`), same as before.
- `environment: Production`, same email recipients on failure
  (kapantzak@gmail.com, hoohooligr@gmail.com) via `dawidd6/action-send-mail@v3`.
- Node 24 (current Active LTS as of this writing) via `actions/setup-node@v4`.
- `npx playwright install --with-deps chromium firefox webkit`, then
  `npx playwright test` with `BASE_URL` from repo variable.
- On failure: upload the Playwright HTML report (`playwright-report/`, 7-day
  retention) instead of the old separate screenshots/videos folders.

## Testing/verification plan

- Run the full suite locally against production (`BASE_URL=https://hoohooli.gr`)
  across all three browser projects before considering the scaffold done.
- Confirm the GA-blocking tests still correctly assert consent state changes (i.e.
  blocking the network call doesn't prevent the client from setting the cookie/
  localStorage state itself).
- Manually trigger the GitHub Actions workflow once (workflow_dispatch) to confirm
  the CI path installs browsers, runs, and (by temporarily forcing a failure) sends
  the notification email and uploads the report artifact correctly.
