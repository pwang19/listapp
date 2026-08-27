import { describe, it, expect } from 'vitest';
import { listsToChecklistHtml } from './printLayouts';

describe('printLayouts', () => {
  it('renders checklist html with checkboxes', () => {
    const html = listsToChecklistHtml([
      {
        name: 'Groceries',
        icon: '🛒',
        items: [
          { text: 'Milk', complete: false, dueDate: '2026-07-28', subItems: [] },
          { text: 'Bread', complete: true, dueDate: '', subItems: [{ text: 'Whole grain', complete: false }] },
        ],
      },
    ]);
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('Milk');
    expect(html).toContain('Whole grain');
  });
});
