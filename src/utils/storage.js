export const STORAGE_KEY = 'listapp.lists';
export const ARCHIVE_KEY = 'listapp.archived';

export function loadLists() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLists(lists) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch {
    // ignore
  }
}

export function loadArchived() {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveArchived(archived) {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archived));
  } catch {
    // ignore
  }
}
