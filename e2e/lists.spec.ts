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

  test('the list menu closes on an outside click or Escape', async ({ listsPage, page }) => {
    const errands = await listsPage.addList('Errands');
    const menuButton = errands.root.getByRole('button', { name: 'List menu' });
    const menu = errands.root.getByRole('menu');

    await menuButton.click();
    await expect(menu).toBeVisible();
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await expect(menu).toBeHidden();

    await menuButton.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();

    await menuButton.click();
    await menuButton.click();
    await expect(menu).toBeHidden();
  });

  test('a list can be widened and stays wide after reload', async ({ listsPage, page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    const errands = await listsPage.addList('Errands');
    await listsPage.addList('Work');
    const normalWidth = (await errands.root.boundingBox())!.width;

    await errands.setWidth('Wide');
    await expect.poll(async () => (await errands.root.boundingBox())!.width).toBeGreaterThan(normalWidth * 1.8);

    await page.reload();
    await expect.poll(async () => (await errands.root.boundingBox())!.width).toBeGreaterThan(normalWidth * 1.8);

    await errands.setWidth('Full row');
    const grid = (await page.locator('.lists-grid').boundingBox())!;
    await expect.poll(async () => (await errands.root.boundingBox())!.width).toBeGreaterThan(grid.width - 40);
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
