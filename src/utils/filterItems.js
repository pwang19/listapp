export function itemMatchesSearch(item, query) {
  if (!query) return true;
  const hay = [
    item.text,
    item.description || '',
    ...(item.subItems || []).map((s) => s.text),
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(query);
}

export function filterItems(items, { itemFilter = 'all', searchQuery = '', tagFilter = '' } = {}) {
  const q = searchQuery.trim().toLowerCase();
  return items.filter((item) => {
    if (itemFilter === 'active' && item.complete) return false;
    if (itemFilter === 'completed' && !item.complete) return false;
    if (tagFilter && !(item.tags || []).includes(tagFilter)) return false;
    return itemMatchesSearch(item, q);
  });
}

export function listMatchesFilters(list, { searchQuery = '', tagFilter = '', itemFilter = 'all' } = {}) {
  const q = searchQuery.trim().toLowerCase();
  if (!q && !tagFilter && itemFilter === 'all') return true;
  const nameHit = q && list.name.toLowerCase().includes(q);
  const itemHit = list.items.some((item) => {
    if (itemFilter === 'active' && item.complete) return false;
    if (itemFilter === 'completed' && !item.complete) return false;
    if (tagFilter && !(item.tags || []).includes(tagFilter)) return false;
    if (!q) return Boolean(tagFilter) || itemFilter !== 'all';
    return itemMatchesSearch(item, q);
  });
  if (tagFilter && !itemHit) return false;
  if (itemFilter !== 'all' && !itemHit) return false;
  if (q) return nameHit || itemHit;
  return true;
}

export function hasActiveFilters({ searchQuery = '', tagFilter = '', itemFilter = 'all' } = {}) {
  return Boolean(searchQuery.trim() || tagFilter || itemFilter !== 'all');
}
