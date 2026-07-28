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
