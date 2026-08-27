function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {import('../types').List[]} lists
 * @param {string} name
 */
export function findListByName(lists, name) {
  const q = name.trim().toLowerCase();
  return lists.find((l) => l.name.toLowerCase() === q) || null;
}

/**
 * @param {string} text
 * @param {import('../types').List[]} [lists]
 */
export function linkifyListMentions(text, lists = []) {
  if (!text || !lists.length) return escapeHtml(text || '');
  return escapeHtml(text).replace(
    /@([a-zA-Z0-9][a-zA-Z0-9 _-]{0,40})/g,
    (match, name) => {
      const list = findListByName(lists, name);
      if (!list) return match;
      return `<button type="button" class="note-list-link" data-list-id="${list.id}">@${escapeHtml(list.name)}</button>`;
    }
  );
}
