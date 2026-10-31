import { test, expect } from './fixtures';

test.describe('items', () => {
  test('quick add parses tag, due date and priority', async ({ listsPage }) => {
    const errands = await listsPage.addList('Errands');
    await errands.addItem('Buy milk #errand !2026-07-25 !p2');

    const row = errands.itemRow('Buy milk');
    await expect(row).toBeVisible();
    await expect(row.locator('.tag-chip')).toHaveText(/errand/i);
    await expect(row.locator('.due-badge')).toHaveText('2026-07-25');
    await expect(row.locator('.priority-badge')).toHaveText('P2');
  });

  test('pasting several lines adds one item per line', async ({ listsPage }) => {
    const errands = await listsPage.addList('Errands');
    await errands.pasteItems('Buy milk\nPost letter\nCall bank');

    await expect(errands.progress).toHaveText('0/3');
    for (const text of ['Buy milk', 'Post letter', 'Call bank']) {
      await expect(errands.item(text)).toBeVisible();
    }
  });

  test('notes and due date set in the details dialog persist', async ({ listsPage, page }) => {
    const errands = await listsPage.addList('Errands');
    await errands.addItem('Buy milk');

    let dialog = await errands.openItem('Buy milk');
    await dialog.getByLabel('Notes (Markdown)').fill('Semi-skimmed, 2 litres');
    await dialog.getByLabel('Due date').fill('2026-12-01');
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();

    await expect(errands.itemRow('Buy milk').locator('.due-badge')).toHaveText('2026-12-01');

    await page.reload();
    dialog = await errands.openItem('Buy milk');
    await expect(dialog.getByLabel('Notes (Markdown)')).toHaveValue('Semi-skimmed, 2 litres');
  });

  test('archiving completed items and restoring one', async ({ listsPage }) => {
    const errands = await listsPage.addList('Errands');
    await errands.addItem('Buy milk');
    await errands.addItem('Post letter');
    await errands.completeCheckbox('Buy milk').check();

    await errands.archiveCompletedButton.click();
    await expect(errands.item('Buy milk')).toBeHidden();
    await expect(errands.progress).toHaveText('0/1');

    await listsPage.moreAction('Archived (1)');
    const shelf = listsPage.page.getByRole('dialog', { name: 'Archived items' });
    await expect(shelf.getByText('Buy milk')).toBeVisible();
    await shelf.getByRole('button', { name: 'Restore' }).click();
    await shelf.getByRole('button', { name: 'Close' }).click();

    await expect(errands.item('Buy milk')).toBeVisible();
  });
});
