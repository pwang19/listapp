import { expect, type Locator, type Page } from '@playwright/test';
import { ListCard } from './ListCard';

export type ItemFilter = 'All' | 'Active' | 'Completed';
export type ViewMode = 'Grid' | 'All items' | 'Kanban' | 'Upcoming' | 'Calendar';

// The main grid: toolbar, the new-list input, and every list card.
export class ListsPage {
  readonly heading: Locator;
  readonly emptyState: Locator;
  readonly newListInput: Locator;
  readonly statusFilter: Locator;
  readonly search: Locator;
  readonly toast: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Lists', exact: true });
    this.emptyState = page.getByText(/No lists yet/);
    this.newListInput = page.getByLabel('Add a new list');
    this.statusFilter = page.getByRole('group', { name: 'Item status filter' });
    this.search = page.getByLabel('Search lists and items');
    this.toast = page.locator('.toast');
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.heading).toBeVisible();
  }

  async addList(name: string): Promise<ListCard> {
    await this.newListInput.fill(name);
    await this.newListInput.press('Enter');
    return this.list(name);
  }

  list(name: string): ListCard {
    return new ListCard(this.page, name);
  }

  async filterItems(filter: ItemFilter) {
    await this.statusFilter.getByRole('button', { name: filter, exact: true }).click();
  }

  async switchView(view: ViewMode) {
    await this.page.getByRole('tablist', { name: 'View mode' }).getByRole('tab', { name: view }).click();
  }

  // Runs an entry from the toolbar's "More actions" menu.
  async moreAction(name: string | RegExp) {
    await this.page.getByRole('button', { name: 'More actions' }).click();
    await this.page.getByRole('menuitem', { name }).click();
  }
}
