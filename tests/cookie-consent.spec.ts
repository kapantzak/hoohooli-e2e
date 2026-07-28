import { test, expect, Page } from '@playwright/test';
import { HomePage } from '../pages/home-page';

async function blockGoogleAnalyticsCollection(page: Page) {
  await page.route((url) => {
    return url.hostname.includes('google-analytics.com') && url.pathname.includes('collect');
  }, (route) => route.abort());
}

test.describe('Cookie consent interactions', () => {
  test('Accept All dismisses the banner and persists analytics consent', async ({ page, context }) => {
    await blockGoogleAnalyticsCollection(page);
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.acceptAllCookies();
    await expect(homePage.cookieBannerText()).toBeHidden();

    // Give GA script time to set cookies
    await page.waitForTimeout(1000);

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

    // Give GA script time to set cookies
    await page.waitForTimeout(1000);

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
