import { test as base, expect } from '@playwright/test';

// Every test in this suite runs against production. Block only the GA
// collection endpoint by default so an unexpected future change in
// hoohooli.gr's analytics implementation can never inject synthetic
// sessions into real production data, even in tests that don't expect
// analytics consent to be granted.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route((url) => {
      return (url.hostname.includes('google-analytics.com') || url.hostname.includes('analytics.google.com'))
        && url.pathname.includes('collect');
    }, (route) => route.abort());
    await use(page);
  },
});

export { expect };
