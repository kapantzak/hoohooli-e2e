import { test, expect } from './fixtures';
import { HomePage } from '../pages/home-page';

test.describe('Cookie consent interactions', () => {
  test('Accept All dismisses the banner and persists analytics consent', async ({ page, context }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.acceptAllCookies();
    await expect(homePage.cookieBannerText()).toBeHidden();

    const consent = await page.evaluate(() => localStorage.getItem('hoohooli-cookie-consent'));
    expect(consent).toBe(JSON.stringify({ analytics: true }));

    // Poll until GA cookie is set
    await expect.poll(async () => (await context.cookies()).some((c) => c.name === '_ga')).toBe(true);

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

    await page.reload();
    await expect(homePage.cookieBannerText()).toBeHidden();

    // Checked after reload, giving GA the same time window the accept-path
    // tests get, so a regression that loads GA despite rejection is caught.
    expect((await context.cookies()).some((c) => c.name === '_ga')).toBe(false);
  });

  test('Settings modal: saving default (no analytics) behaves like Reject', async ({ page, context }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const settings = await homePage.openCookieSettings();
    await expect(settings.necessaryCheckbox()).toBeChecked();
    await expect(settings.necessaryCheckbox()).toBeDisabled();

    await settings.save();

    await expect(homePage.cookieBannerText()).toBeHidden();
    const consent = await page.evaluate(() => localStorage.getItem('hoohooli-cookie-consent'));
    expect(consent).toBe(JSON.stringify({ analytics: false }));
    expect((await context.cookies()).some((c) => c.name === '_ga')).toBe(false);
  });

  test('Settings modal: enabling analytics and saving behaves like Accept All', async ({ page, context }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const settings = await homePage.openCookieSettings();
    await settings.analyticsCheckbox().check();
    await settings.save();

    await expect(homePage.cookieBannerText()).toBeHidden();

    const consent = await page.evaluate(() => localStorage.getItem('hoohooli-cookie-consent'));
    expect(consent).toBe(JSON.stringify({ analytics: true }));

    // Poll until GA cookie is set
    await expect.poll(async () => (await context.cookies()).some((c) => c.name === '_ga')).toBe(true);
  });

  test('Settings modal: Back discards the choice', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const settings = await homePage.openCookieSettings();
    await settings.goBack();

    const consent = await page.evaluate(() => localStorage.getItem('hoohooli-cookie-consent'));
    expect(consent).toBeNull();

    await page.reload();
    await expect(homePage.cookieBannerText()).toBeVisible();
  });
});
