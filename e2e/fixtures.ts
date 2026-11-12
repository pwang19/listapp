import { test as base } from '@playwright/test';
import { ListsPage } from './pages/ListsPage';

// Every test gets a fresh browser context, so localStorage starts empty and
// tests never share state. `listsPage` arrives already loaded.
export const test = base.extend<{ listsPage: ListsPage }>({
  listsPage: async ({ page }, use) => {
    const listsPage = new ListsPage(page);
    await listsPage.goto();
    await use(listsPage);
  },
});

export { expect } from '@playwright/test';
