export function itemMatchesSearch(item, query, { includeCustomFields = true } = {}) {
  if (!query) return true;
  const parts = [
    item.text,
    item.description || '',
    ...(item.subItems || []).map((s) => s.text),
  ];
  if (includeCustomFields && item.customFieldValues) {
    parts.push(...Object.values(item.customFieldValues).map(String));
  }
  const hay = parts.join(' ').toLowerCase();
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .every((token) => hay.includes(token));
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

export function filterItemRows(rows, filters = {}) {
  const filtered = filterItems(rows.map((r) => r.item), filters);
  const filteredIds = new Set(filtered.map((i) => i.id));
  return rows.filter((r) => filteredIds.has(r.item.id));
}
