function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {import('../types').List[]} lists
 */
export function listsToChecklistHtml(lists) {
  const parts = [
    '<!doctype html><html><head><meta charset="utf-8"><title>Lists Checklist</title>',
    '<style>',
    'body { font-family: system-ui, sans-serif; max-width: 720px; margin: 1.5rem auto; padding: 0 1rem; color: #111; }',
    'h1 { font-size: 1.5rem; margin-bottom: 1.5rem; }',
    'h2 { font-size: 1.1rem; margin: 1.25rem 0 0.5rem; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem; }',
    '.checklist { list-style: none; padding: 0; margin: 0; }',
    '.checklist li { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.35rem 0; border-bottom: 1px solid #f0f0f0; }',
    '.checklist input { margin-top: 0.2rem; width: 1rem; height: 1rem; }',
    '.item-text { flex: 1; }',
    '.item-text.is-complete { text-decoration: line-through; color: #888; }',
    '.item-meta { font-size: 0.8rem; color: #666; }',
    '.sub-list { list-style: none; padding: 0.25rem 0 0 1.5rem; margin: 0; }',
    '@media print { body { margin: 0.5in; } h2 { page-break-after: avoid; } }',
    '</style></head><body>',
    '<h1>Lists Checklist</h1>',
  ];

  lists.forEach((list) => {
    parts.push(`<h2>${escapeHtml(list.icon || '📋')} ${escapeHtml(list.name)}</h2>`);
    if (!list.items?.length) {
      parts.push('<p><em>Empty list.</em></p>');
      return;
    }
    parts.push('<ul class="checklist">');
    list.items.forEach((item) => {
      const checked = item.complete ? ' checked' : '';
      const completeClass = item.complete ? ' is-complete' : '';
      const due = item.dueDate ? ` <span class="item-meta">(due ${escapeHtml(item.dueDate)})</span>` : '';
      parts.push(
        `<li><input type="checkbox"${checked} disabled><span class="item-text${completeClass}">${escapeHtml(item.text)}${due}</span></li>`
      );
      if (item.subItems?.length) {
        parts.push('<ul class="sub-list">');
        item.subItems.forEach((sub) => {
          const subChecked = sub.complete ? ' checked' : '';
          const subClass = sub.complete ? ' is-complete' : '';
          parts.push(
            `<li><input type="checkbox"${subChecked} disabled><span class="item-text${subClass}">${escapeHtml(sub.text)}</span></li>`
          );
        });
        parts.push('</ul>');
      }
    });
    parts.push('</ul>');
  });

  parts.push('</body></html>');
  return parts.join('');
}

/**
 * @param {string} html
 */
export function printHtmlDocument(html) {
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  return true;
}
