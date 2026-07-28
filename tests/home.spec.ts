import { test, expect } from './fixtures';
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
