# Playwright E2E Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a brand new TypeScript Playwright e2e project for hoohooli.gr, covering the home page and its cookie-consent banner (the only flows currently verifiable on the rebuilt Next.js site), plus a CI workflow that recreates the old Cypress suite's operational behavior.

**Architecture:** Page Object Model with a small `BasePage` and one `HomePage` object plus a `CookieSettingsModal` object for the settings dialog; two spec files (`tests/home.spec.ts`, `tests/cookie-consent.spec.ts`); a single GitHub Actions workflow for the daily production run.

**Tech Stack:** `@playwright/test`, TypeScript, `dotenv`, GitHub Actions (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`, `dawidd6/action-send-mail@v3`).

## Global Constraints

- Design doc of record: `docs/superpowers/specs/2026-07-28-playwright-scaffold-design.md`.
- Language: TypeScript, zero-build (Playwright's native TS support).
- Browsers: chromium, firefox, webkit — all three must be configured as Playwright projects.
- Env var: `BASE_URL` only (no `CYPRESS_`-style prefix), loaded via `dotenv` in `playwright.config.ts`, feeding `use.baseURL`.
- `retries: 2` when `process.env.CI` is set, `0` locally.
- `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`, `trace: 'on-first-retry'`.
- Site under test: `https://hoohooli.gr` (production; no staging environment exists).
- GA network blocking: tests that trigger the "analytics enabled" path must block requests matching `/google-analytics\.com|analytics\.google\.com/` — but must NOT block `googletagmanager.com`, since that's where the consent script itself loads from and is what sets the `_ga` cookie locally; blocking it would prevent the cookie from ever being set.
- CI: Node 24, daily cron `0 1 * * *` + `workflow_dispatch`, `environment: Production`, email-on-failure to `kapantzak@gmail.com` (cc `hoohooligr@gmail.com`) via `dawidd6/action-send-mail@v3`, Playwright HTML report uploaded on failure (7-day retention).
- The old debug workflow (`test.yml`) is explicitly NOT recreated.
- Verified real-site facts (from live probe, see design doc) — use these exact strings, do not re-derive:
  - Title: `hoohooli — Χειροποίητα για Μωρά & Παιδιά`
  - Cookie banner paragraph text (substring): `Χρησιμοποιούμε cookies απαραίτητα`
  - Buttons (exact text): `Αποδοχή Όλων` (Accept All), `Απόρριψη` (Reject), `Ρυθμίσεις` (Settings — collides as a substring with the footer's "Ρυθμίσεις Cookies" button, so this locator MUST use `exact: true`)
  - Settings modal: `Αποθήκευση Επιλογών` (Save) and `Πίσω` (Back) buttons; two checkboxes with **no accessible name** — first is "Απαραίτητα" (Necessary, checked+disabled), second is "Στατιστικά" (Analytics, unchecked) — must be located positionally (`getByRole('checkbox').nth(0)` / `.nth(1)`), not by name.
  - `localStorage["hoohooli-cookie-consent"]` is `{"analytics":true}` after granting, `{"analytics":false}` after declining.
  - Granting analytics sets real `_ga`/`_ga_*` cookies; declining sets none.

---

### Task 1: Project scaffold, Playwright config, and home page smoke tests

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `playwright.config.ts`
- Create: `pages/base-page.ts`
- Create: `pages/home-page.ts`
- Create: `tests/home.spec.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `class BasePage { constructor(protected page: Page); async goto(path?: string): Promise<void>; }`
  - `class HomePage extends BasePage { constructor(page: Page); async goto(): Promise<void>; heading(): Locator; acceptAllButton(): Locator; rejectButton(): Locator; settingsButton(): Locator; cookieBannerText(): Locator; }`
  - `playwright.config.ts` default export with `use.baseURL` from `BASE_URL` env var and 3 projects (chromium, firefox, webkit).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "hoohooli-e2e",
  "version": "1.0.0",
  "private": true,
  "description": "End-to-end tests for hoohooli.gr",
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@types/node": "^22.0.0",
    "dotenv": "^16.4.5",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["node", "@playwright/test"]
  },
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
.env
test-results/
playwright-report/
playwright/.cache/
```

- [ ] **Step 4: Create `.env.example`**

```
BASE_URL=https://hoohooli.gr
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: `node_modules/` and `package-lock.json` created, no errors.

- [ ] **Step 6: Install Playwright browsers**

Run: `npx playwright install --with-deps chromium firefox webkit`
Expected: three browser binaries download successfully.

- [ ] **Step 7: Create a local `.env` (gitignored, do not commit)**

Run: `cp .env.example .env`
Expected: `.env` now contains `BASE_URL=https://hoohooli.gr`. Confirm with `git status` that `.env` does NOT show as trackable (it must be ignored per Step 3).

- [ ] **Step 8: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

- [ ] **Step 9: Write the failing test — `tests/home.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home-page';

test.describe('Home page', () => {
  test('has the expected title and renders the main heading', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(page).toHaveTitle('hoohooli — Χειροποίητα για Μωρά & Παιδιά');
    await expect(homePage.heading()).toContainText('Χειροποίητα');
  });

  test('shows the cookie consent banner with all three actions', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.cookieBannerText()).toBeVisible();
    await expect(homePage.acceptAllButton()).toBeVisible();
    await expect(homePage.rejectButton()).toBeVisible();
    await expect(homePage.settingsButton()).toBeVisible();
  });
});
```

- [ ] **Step 10: Run the test to verify it fails**

Run: `npx playwright test tests/home.spec.ts`
Expected: FAIL — TypeScript/module resolution error, `Cannot find module '../pages/home-page'` (the file doesn't exist yet).

- [ ] **Step 11: Implement the page objects**

`pages/base-page.ts`:
```ts
import { Page } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string = '/') {
    await this.page.goto(path);
  }
}
```

`pages/home-page.ts`:
```ts
import { Page } from '@playwright/test';
import { BasePage } from './base-page';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto('/');
  }

  heading() {
    return this.page.getByRole('heading', { level: 1 });
  }

  acceptAllButton() {
    return this.page.getByRole('button', { name: 'Αποδοχή Όλων', exact: true });
  }

  rejectButton() {
    return this.page.getByRole('button', { name: 'Απόρριψη', exact: true });
  }

  settingsButton() {
    return this.page.getByRole('button', { name: 'Ρυθμίσεις', exact: true });
  }

  cookieBannerText() {
    return this.page.getByText('Χρησιμοποιούμε cookies απαραίτητα');
  }
}
```

- [ ] **Step 12: Run the test to verify it passes, across all three browsers**

Run: `npx playwright test tests/home.spec.ts`
Expected: PASS — 2 tests × 3 browser projects = 6 passed.

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore .env.example playwright.config.ts pages/base-page.ts pages/home-page.ts tests/home.spec.ts
git commit -m "Scaffold Playwright TypeScript project with home page tests"
```

---

### Task 2: Cookie consent modal and interaction tests

**Files:**
- Create: `pages/cookie-settings-modal.ts`
- Modify: `pages/home-page.ts` (add cookie action methods)
- Create: `tests/cookie-consent.spec.ts`

**Interfaces:**
- Consumes: `HomePage` from Task 1 (`goto()`, `acceptAllButton()`, `rejectButton()`, `settingsButton()`, `cookieBannerText()`).
- Produces:
  - `class CookieSettingsModal { constructor(page: Page); necessaryCheckbox(): Locator; analyticsCheckbox(): Locator; saveButton(): Locator; backButton(): Locator; async save(): Promise<void>; async goBack(): Promise<void>; }`
  - `HomePage` additions: `async acceptAllCookies(): Promise<void>; async rejectCookies(): Promise<void>; async openCookieSettings(): Promise<CookieSettingsModal>;`

- [ ] **Step 1: Write the failing test — `tests/cookie-consent.spec.ts`**

```ts
import { test, expect, Page } from '@playwright/test';
import { HomePage } from '../pages/home-page';

async function blockGoogleAnalyticsCollection(page: Page) {
  await page.route(/google-analytics\.com|analytics\.google\.com/, (route) => route.abort());
}

test.describe('Cookie consent interactions', () => {
  test('Accept All dismisses the banner and persists analytics consent', async ({ page, context }) => {
    await blockGoogleAnalyticsCollection(page);
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.acceptAllCookies();
    await expect(homePage.cookieBannerText()).toBeHidden();

    const consent = await page.evaluate(() => localStorage.getItem('hoohooli-cookie-consent'));
    expect(consent).toBe(JSON.stringify({ analytics: true }));
    expect((await context.cookies()).some((c) => c.name === '_ga')).toBe(true);

    await page.reload();
    await expect(homePage.cookieBannerText()).toBeHidden();
  });

  test('Reject dismisses the banner without granting analytics', async ({ page, context }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.rejectCookies();
    await expect(homePage.cookieBannerText()).toBeHidden();

    const consent = await page.evaluate(() => localStorage.getItem('hoohooli-cookie-consent'));
    expect(consent).toBe(JSON.stringify({ analytics: false }));
    expect((await context.cookies()).some((c) => c.name === '_ga')).toBe(false);

    await page.reload();
    await expect(homePage.cookieBannerText()).toBeHidden();
  });

  test('Settings modal: saving default (no analytics) behaves like Reject', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const settings = await homePage.openCookieSettings();
    await settings.save();

    await expect(homePage.cookieBannerText()).toBeHidden();
    const consent = await page.evaluate(() => localStorage.getItem('hoohooli-cookie-consent'));
    expect(consent).toBe(JSON.stringify({ analytics: false }));
  });

  test('Settings modal: enabling analytics and saving behaves like Accept All', async ({ page, context }) => {
    await blockGoogleAnalyticsCollection(page);
    const homePage = new HomePage(page);
    await homePage.goto();

    const settings = await homePage.openCookieSettings();
    await settings.analyticsCheckbox().check();
    await settings.save();

    await expect(homePage.cookieBannerText()).toBeHidden();
    const consent = await page.evaluate(() => localStorage.getItem('hoohooli-cookie-consent'));
    expect(consent).toBe(JSON.stringify({ analytics: true }));
    expect((await context.cookies()).some((c) => c.name === '_ga')).toBe(true);
  });

  test('Settings modal: Back discards the choice', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const settings = await homePage.openCookieSettings();
    await settings.goBack();

    await page.reload();
    await expect(homePage.cookieBannerText()).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/cookie-consent.spec.ts`
Expected: FAIL — `homePage.acceptAllCookies is not a function` (or equivalent TypeScript error), since these methods don't exist on `HomePage` yet and `CookieSettingsModal` doesn't exist.

- [ ] **Step 3: Implement `CookieSettingsModal`**

`pages/cookie-settings-modal.ts`:
```ts
import { Page } from '@playwright/test';

export class CookieSettingsModal {
  constructor(private page: Page) {}

  necessaryCheckbox() {
    return this.page.getByRole('checkbox').nth(0);
  }

  analyticsCheckbox() {
    return this.page.getByRole('checkbox').nth(1);
  }

  saveButton() {
    return this.page.getByRole('button', { name: 'Αποθήκευση Επιλογών' });
  }

  backButton() {
    return this.page.getByRole('button', { name: 'Πίσω', exact: true });
  }

  async save() {
    await this.saveButton().click();
  }

  async goBack() {
    await this.backButton().click();
  }
}
```

- [ ] **Step 4: Add cookie action methods to `HomePage`**

In `pages/home-page.ts`, add the import and these three methods inside the `HomePage` class (after `cookieBannerText()`):

```ts
// add to the import line at the top of the file:
import { CookieSettingsModal } from './cookie-settings-modal';

// add inside the HomePage class body:
  async acceptAllCookies() {
    await this.acceptAllButton().click();
  }

  async rejectCookies() {
    await this.rejectButton().click();
  }

  async openCookieSettings(): Promise<CookieSettingsModal> {
    await this.settingsButton().click();
    return new CookieSettingsModal(this.page);
  }
```

- [ ] **Step 5: Run the test to verify it passes, across all three browsers**

Run: `npx playwright test tests/cookie-consent.spec.ts`
Expected: PASS — 5 tests × 3 browser projects = 15 passed. If the "Accept All"/"enabling analytics" tests fail to see a `_ga` cookie, the GA route block in Step 1 is too broad (it may be catching the `googletagmanager.com` script load as well as collection calls) — narrow the regex so only collection-endpoint requests are aborted, per the Global Constraints note, and re-run.

- [ ] **Step 6: Run the full suite together to confirm no cross-test interference**

Run: `npx playwright test`
Expected: PASS — 7 tests × 3 browsers = 21 passed (Task 1's `home.spec.ts` + this task's `cookie-consent.spec.ts`).

- [ ] **Step 7: Commit**

```bash
git add pages/cookie-settings-modal.ts pages/home-page.ts tests/cookie-consent.spec.ts
git commit -m "Add cookie consent interaction tests and settings modal page object"
```

---

### Task 3: CI workflow

**Files:**
- Create: `.github/workflows/e2e.yml`

**Interfaces:**
- Consumes: `package.json` scripts (`npm ci`, `npx playwright test`) from Task 1; no test file names are referenced directly (the workflow runs the whole suite).
- Produces: a scheduled + manually-triggerable GitHub Actions workflow.

- [ ] **Step 1: Create `.github/workflows/e2e.yml`**

```yaml
name: Playwright E2E Tests

on:
  workflow_dispatch:
  schedule:
    - cron: "0 1 * * *"

jobs:
  run-playwright-tests:
    runs-on: ubuntu-latest
    environment: Production
    steps:
      - name: Checkout the code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "24"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium firefox webkit

      - name: Run Playwright tests
        run: npx playwright test
        env:
          BASE_URL: ${{ vars.BASE_URL }}

      - name: Send Email Notification
        if: failure()
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.gmail.com
          server_port: 587
          username: ${{ secrets.SMTP_USERNAME }}
          password: ${{ secrets.SMTP_PASSWORD }}
          subject: "Hoohooli - Playwright Tests Failed!"
          body: |
            The Playwright tests have failed in ${{ github.repository }} repository on the ${{ github.ref }} branch.
          to: "kapantzak@gmail.com"
          cc: "hoohooligr@gmail.com"
          from: "no-reply@github.com"

      - name: Upload Playwright report on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/e2e.yml'))" && echo "valid"`
Expected: prints `valid` with no exception. (If `pyyaml` isn't available, alternatively run `npx js-yaml .github/workflows/e2e.yml >/dev/null && echo valid`.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/e2e.yml
git commit -m "Add Playwright CI workflow for daily production run"
```

**Note for later (not part of this task):** the `BASE_URL` repo variable and `SMTP_USERNAME`/`SMTP_PASSWORD` secrets already exist on this GitHub repo from the old Cypress workflow, so no new repo configuration should be needed — but this can only be confirmed once the branch is pushed and the workflow is manually triggered (`workflow_dispatch`) after merge, which is an operational step outside this plan's scope.

---

### Task 4: README

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: final project shape from Tasks 1–3 (scripts, env vars, structure) to document accurately.
- Produces: none consumed by other tasks (documentation only).

- [ ] **Step 1: Create `README.md`**

```md
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Add README documenting Playwright setup and usage"
```
