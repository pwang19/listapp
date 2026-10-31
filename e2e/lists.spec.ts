import { test, expect } from './fixtures';

test.describe('lists', () => {
  test('deleting a list can be undone from the toast', async ({ listsPage }) => {
    const errands = await listsPage.addList('Errands');
    await errands.addItem('Buy milk');

    await errands.delete();
    await expect(errands.root).toBeHidden();

    await listsPage.toast.getByRole('button', { name: /^Undo/ }).click();
    await expect(errands.root).toBeVisible();
    await expect(errands.item('Buy milk')).toBeVisible();
  });

  test('search narrows the grid to matching items', async ({ listsPage }) => {
    const errands = await listsPage.addList('Errands');
    await errands.addItem('Buy milk');
    await errands.addItem('Post letter');
    const work = await listsPage.addList('Work');
    await work.addItem('Write report');

    await listsPage.search.fill('milk');

    await expect(errands.item('Buy milk')).toBeVisible();
    await expect(errands.item('Post letter')).toBeHidden();
    await expect(work.root).toBeHidden();

    await listsPage.search.fill('');
    await expect(work.item('Write report')).toBeVisible();
  });

  test('All items view shows items from every list', async ({ listsPage, page }) => {
    const errands = await listsPage.addList('Errands');
    await errands.addItem('Buy milk');
    const work = await listsPage.addList('Work');
    await work.addItem('Write report');

    await listsPage.switchView('All items');

    await expect(page.getByText('Buy milk')).toBeVisible();
    await expect(page.getByText('Write report')).toBeVisible();
    await expect(errands.root).toBeHidden();
  });
});
