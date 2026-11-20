import { test, expect } from './fixtures';

test.describe('selection', () => {
  test('select items without a mode, act on them, undo in one step', async ({ listsPage, page }) => {
    const errands = await listsPage.addList('Errands');
    await listsPage.addList('Later');
    for (const text of ['Buy milk', 'Post letter', 'Call bank', 'Water plants']) {
      await errands.addItem(text);
    }

    const bar = page.getByRole('toolbar', { name: /selected$/ });
    await expect(bar).toBeHidden();

    // Hover reveals the select control; shift-click selects the range.
    await errands.itemRow('Buy milk').hover();
    await errands.selectToggle('Buy milk').click();
    await expect(bar).toContainText('1 selected');
    await errands.selectToggle('Call bank').click({ modifiers: ['Shift'] });
    await expect(bar).toContainText('3 selected');
    await expect(errands.selectToggle('Post letter')).toHaveAttribute('aria-checked', 'true');
    await expect(errands.selectToggle('Water plants')).toHaveAttribute('aria-checked', 'false');

    await bar.getByLabel('Move selected items to list').selectOption({ label: '📋 Later' });
    await expect(bar).toBeHidden();
    const later = listsPage.list('Later');
    await expect(later.progress).toHaveText('0/3');
    await expect(errands.progress).toHaveText('0/1');

    await page.keyboard.press('ControlOrMeta+z');
    await expect(errands.progress).toHaveText('0/4');
    await expect(later.root.getByRole('listitem')).toHaveCount(0);
  });

  test('Esc and ✕ clear the selection; select all picks every visible item', async ({ listsPage, page }) => {
    const errands = await listsPage.addList('Errands');
    await errands.addItem('Buy milk');
    await errands.addItem('Post letter');
    const bar = page.getByRole('toolbar', { name: /selected$/ });

    await errands.selectToggle('Buy milk').click();
    await bar.getByRole('button', { name: 'Select all (2)' }).click();
    await expect(bar).toContainText('2 selected');
    await page.keyboard.press('Escape');
    await expect(bar).toBeHidden();

    await errands.selectToggle('Post letter').click();
    await bar.getByRole('button', { name: 'Clear selection' }).click();
    await expect(bar).toBeHidden();
  });

  test('complete from the All items view', async ({ listsPage, page }) => {
    const errands = await listsPage.addList('Errands');
    await errands.addItem('Buy milk');
    await errands.addItem('Post letter');
    await listsPage.switchView('All items');

    const table = page.getByRole('table');
    await table.getByRole('checkbox', { name: 'Select all items' }).check();
    const bar = page.getByRole('toolbar', { name: /selected$/ });
    await expect(bar).toContainText('2 selected');
    await expect(table.getByRole('checkbox', { name: 'Select Buy milk' })).toBeChecked();

    await bar.getByRole('button', { name: /Complete/ }).click();
    await expect(bar).toBeHidden();
    await expect(table.getByRole('cell', { name: 'Done', exact: true })).toHaveCount(2);
  });
});
