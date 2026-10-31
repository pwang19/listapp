import type { Locator, Page } from '@playwright/test';

// One list on the grid, found by its title.
export class ListCard {
  readonly root: Locator;
  readonly newItemInput: Locator;
  readonly progress: Locator;
  readonly archiveCompletedButton: Locator;

  constructor(readonly page: Page, readonly name: string) {
    this.root = page
      .locator('article.list-card')
      .filter({ has: page.getByRole('heading', { name, exact: true }) });
    this.newItemInput = this.root.getByLabel(`Add item to ${name}`);
    this.progress = this.root.locator('.list-progress');
    this.archiveCompletedButton = this.root.getByRole('button', { name: /^Archive \d+ completed$/ });
  }

  async addItem(text: string) {
    await this.newItemInput.fill(text);
    await this.newItemInput.press('Enter');
  }

  item(text: string): Locator {
    return this.root.getByRole('button', { name: `Open details for ${text}` });
  }

  // The whole item row, for badges and tag chips that sit beside the name.
  itemRow(text: string): Locator {
    const name = this.page.getByRole('button', { name: `Open details for ${text}` });
    return this.root.locator('.list-item').filter({ has: name });
  }

  completeCheckbox(text: string): Locator {
    return this.root.getByRole('checkbox', { name: `Complete ${text}` });
  }

  async openItem(text: string): Promise<Locator> {
    await this.item(text).click();
    return this.page.getByRole('dialog');
  }

  async delete() {
    await this.root.getByRole('button', { name: 'List menu' }).click();
    await this.root.getByRole('menuitem', { name: `Delete list ${this.name}` }).click();
    await this.page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  }

  // Multi-line text only splits into items through a real paste event;
  // fill() would strip the newlines from a single-line input.
  async pasteItems(text: string) {
    await this.newItemInput.focus();
    await this.newItemInput.evaluate((input, data) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text', data);
      input.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
    }, text);
  }
}
