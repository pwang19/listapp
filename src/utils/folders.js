/**
 * @param {import('../types').List[]} lists
 */
export function getRootLists(lists) {
  return lists.filter((l) => !l.parentId);
}

/**
 * @param {import('../types').List[]} lists
 * @param {string} parentId
 */
export function getChildLists(lists, parentId) {
  return lists.filter((l) => l.parentId === parentId);
}

/**
 * @param {import('../types').List[]} lists
 * @param {Set<string>} expandedFolderIds
 */
export function buildFolderSections(lists, expandedFolderIds = new Set(), allLists = lists) {
  const roots = getRootLists(lists);
  const sections = [];

  roots.forEach((entry) => {
    if (entry.isFolder) {
      const children = getChildLists(allLists, entry.id);
      sections.push({
        type: 'folder',
        folder: entry,
        children,
        expanded: expandedFolderIds.has(entry.id),
      });
    } else {
      sections.push({ type: 'list', list: entry });
    }
  });

  const orphanChildren = lists.filter(
    (l) => l.parentId && !lists.some((p) => p.id === l.parentId)
  );
  orphanChildren.forEach((list) => {
    sections.push({ type: 'list', list });
  });

  return sections;
}
