function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormat(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>'
    );
}

/**
 * Minimal markdown: paragraphs, lists, blockquotes, inline bold/italic/code/links.
 */
export function renderMarkdown(text) {
  if (!text || !text.trim()) return '';

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.startsWith('> ')) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quote.push(inlineFormat(lines[i].slice(2)));
        i += 1;
      }
      blocks.push(`<blockquote><p>${quote.join('<br/>')}</p></blockquote>`);
      continue;
    }

    if (/^[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(`<li>${inlineFormat(lines[i].slice(2))}</li>`);
        i += 1;
      }
      blocks.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li>${inlineFormat(lines[i].replace(/^\d+\. /, ''))}</li>`);
        i += 1;
      }
      blocks.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('> ') &&
      !/^[-*] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i])
    ) {
      para.push(inlineFormat(lines[i]));
      i += 1;
    }
    blocks.push(`<p>${para.join('<br/>')}</p>`);
  }

  return blocks.join('');
}

export function listsToMarkdown(lists) {
  if (!lists.length) return '# Lists\n\n_No lists yet._\n';

  const parts = ['# Lists', ''];
  lists.forEach((list) => {
    parts.push(`## ${list.icon || '📋'} ${list.name}`);
    parts.push('');
    if (!list.items.length) {
      parts.push('_Empty list._');
      parts.push('');
      return;
    }
    list.items.forEach((item) => {
      const box = item.complete ? 'x' : ' ';
      const due = item.dueDate ? ` _(due ${item.dueDate})_` : '';
      const tags =
        item.tags && item.tags.length ? ` \`${item.tags.join(', ')}\`` : '';
      parts.push(`- [${box}] ${item.text}${due}${tags}`);
      if (item.description) {
        item.description.split('\n').forEach((line) => {
          parts.push(`  > ${line}`);
        });
      }
      (item.subItems || []).forEach((sub) => {
        const subBox = sub.complete ? 'x' : ' ';
        parts.push(`  - [${subBox}] ${sub.text}`);
      });
    });
    parts.push('');
  });
  return parts.join('\n');
}

export function isOverdue(dueDate, complete) {
  if (!dueDate || complete) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return due < today;
}

export function isDueSoon(dueDate, complete) {
  if (!dueDate || complete || isOverdue(dueDate, complete)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const diff = (due - today) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 2;
}

export function reorderArray(items, activeId, overId) {
  const oldIndex = items.findIndex((item) => item.id === activeId);
  const newIndex = items.findIndex((item) => item.id === overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return items;
  const next = [...items];
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);
  return next;
}

export function listToMarkdown(list) {
  const parts = [`## ${list.icon || '📋'} ${list.name}`, ''];
  if (!list.items.length) {
    parts.push('_Empty list._');
    return parts.join('\n');
  }
  list.items.forEach((item) => {
    const box = item.complete ? 'x' : ' ';
    const due = item.dueDate ? ` _(due ${item.dueDate})_` : '';
    const tags = item.tags?.length ? ` \`${item.tags.join(', ')}\`` : '';
    const pri = item.priority ? ` !p${item.priority}` : '';
    parts.push(`- [${box}] ${item.text}${due}${tags}${pri}`);
    if (item.description) {
      item.description.split('\n').forEach((line) => {
        parts.push(`  > ${line}`);
      });
    }
    (item.subItems || []).forEach((sub) => {
      const subBox = sub.complete ? 'x' : ' ';
      parts.push(`  - [${subBox}] ${sub.text}`);
    });
  });
  return parts.join('\n');
}

export function getUpcomingItems(lists, { daysAhead = 7 } = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + daysAhead);
  const results = [];
  lists.forEach((list) => {
    list.items.forEach((item) => {
      if (!item.dueDate || item.complete) return;
      const due = new Date(`${item.dueDate}T00:00:00`);
      if (due <= end) {
        results.push({
          listId: list.id,
          listName: list.name,
          listIcon: list.icon,
          item,
          overdue: isOverdue(item.dueDate, false),
          dueSoon: isDueSoon(item.dueDate, false),
        });
      }
    });
  });
  return results.sort((a, b) => a.item.dueDate.localeCompare(b.item.dueDate));
}

export function flattenAllItems(lists) {
  const rows = [];
  lists.forEach((list) => {
    list.items.forEach((item) => {
      rows.push({
        listId: list.id,
        listName: list.name,
        listColor: list.color,
        listIcon: list.icon,
        item,
      });
    });
  });
  return rows;
}

export function isListFullyComplete(list) {
  return list.items.length > 0 && list.items.every((i) => i.complete);
}
