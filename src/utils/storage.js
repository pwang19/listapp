export const STORAGE_KEY = 'listapp.lists';
export const ARCHIVE_KEY = 'listapp.archived';
export const SETTINGS_KEY = 'listapp.settings';
export const CUSTOM_TAGS_KEY = 'listapp.customTags';
export const USER_TEMPLATES_KEY = 'listapp.userTemplates';
export const BACKUP_KEY = 'listapp.backup';

export class StorageError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

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
    saveBackup(lists);
    return { ok: true };
  } catch (err) {
    if (err?.name === 'QuotaExceededError') {
      return { ok: false, error: 'Storage full. Export your data and clear old backups.' };
    }
    return { ok: false, error: 'Could not save lists.' };
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
    return { ok: true };
  } catch (err) {
    if (err?.name === 'QuotaExceededError') {
      return { ok: false, error: 'Storage full.' };
    }
    return { ok: false, error: 'Could not save archive.' };
  }
}

const DEFAULT_SETTINGS = {
  darkMode: 'system',
  lastBackupAt: '',
  dismissedBackupReminder: false,
  collapsedListIds: [],
  pinnedListIds: [],
  focusListId: '',
  viewMode: 'grid',
  lastUsedListId: '',
  kanbanGroupBy: 'status',
  priorityScaleVersion: 1,
};

export function loadSettings() {
  const stored = safeParse(localStorage.getItem(SETTINGS_KEY), {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function loadCustomTags() {
  const tags = safeParse(localStorage.getItem(CUSTOM_TAGS_KEY), []);
  return Array.isArray(tags) ? tags : [];
}

export function saveCustomTags(tags) {
  try {
    localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function loadUserTemplates() {
  const templates = safeParse(localStorage.getItem(USER_TEMPLATES_KEY), []);
  return Array.isArray(templates) ? templates : [];
}

export function saveUserTemplates(templates) {
  try {
    localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(templates));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function saveBackup(lists) {
  try {
    localStorage.setItem(
      BACKUP_KEY,
      JSON.stringify({ savedAt: new Date().toISOString(), lists })
    );
  } catch {
    // backup is best-effort
  }
}

export function loadBackup() {
  return safeParse(localStorage.getItem(BACKUP_KEY), null);
}

export function needsBackupReminder(settings) {
  if (settings.dismissedBackupReminder) return false;
  if (!settings.lastBackupAt) return true;
  const last = new Date(settings.lastBackupAt);
  const days = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
  return days >= 7;
}

export function downloadBackup(lists, archived, customTags) {
  const payload = {
    version: 3,
    exportedAt: new Date().toISOString(),
    lists,
    archived,
    customTags,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `listapp-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
