import { test, expect } from './fixtures';

test.describe('smoke', () => {
  test('shows the empty state on first launch', async ({ listsPage }) => {
    await expect(listsPage.emptyState).toBeVisible();
  });

  test('creates a list', async ({ listsPage }) => {
    const groceries = await listsPage.addList('Groceries');

    await expect(groceries.root).toBeVisible();
    await expect(listsPage.emptyState).toBeHidden();
  });

  test('adds an item to a list', async ({ listsPage }) => {
    const errands = await listsPage.addList('Errands');
    await errands.addItem('Buy milk');

    await expect(errands.item('Buy milk')).toBeVisible();
    await expect(errands.progress).toHaveText('0/1');
  });

  test('completing an item moves it between the status filters', async ({ listsPage }) => {
    const errands = await listsPage.addList('Errands');
    await errands.addItem('Buy milk');
    await errands.addItem('Post letter');

    await errands.completeCheckbox('Buy milk').check();
    await expect(errands.progress).toHaveText('1/2');

    await listsPage.filterItems('Active');
    await expect(errands.item('Buy milk')).toBeHidden();
    await expect(errands.item('Post letter')).toBeVisible();

    await listsPage.filterItems('Completed');
    await expect(errands.item('Buy milk')).toBeVisible();
    await expect(errands.item('Post letter')).toBeHidden();
  });

  test('keeps lists and items after a reload', async ({ listsPage, page }) => {
    const errands = await listsPage.addList('Errands');
    await errands.addItem('Buy milk');
    await errands.completeCheckbox('Buy milk').check();

    await page.reload();

    await expect(errands.item('Buy milk')).toBeVisible();
    await expect(errands.completeCheckbox('Buy milk')).toBeChecked();
  });
});
