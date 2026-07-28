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
