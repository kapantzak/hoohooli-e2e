import { Page } from '@playwright/test';

export class CookieSettingsModal {
  constructor(private page: Page) {}

  // No role="dialog" or test-id exists on the live site; the panel is the
  // direct parent <div> of the "Ρυθμίσεις Cookies" heading (verified against
  // production — wraps both checkboxes and both buttons, count === 1).
  private root() {
    return this.page.locator('xpath=//h3[normalize-space(text())="Ρυθμίσεις Cookies"]/parent::div');
  }

  necessaryCheckbox() {
    return this.root().getByRole('checkbox').nth(0);
  }

  analyticsCheckbox() {
    return this.root().getByRole('checkbox').nth(1);
  }

  saveButton() {
    return this.root().getByRole('button', { name: 'Αποθήκευση Επιλογών' });
  }

  backButton() {
    return this.root().getByRole('button', { name: 'Πίσω', exact: true });
  }

  async save() {
    await this.saveButton().click();
  }

  async goBack() {
    await this.backButton().click();
  }
}
