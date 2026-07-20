/** @typedef {{ id: string; text: string; complete: boolean }} SubItem */

/**
 * @typedef {Object} Item
 * @property {string} id
 * @property {string} text
 * @property {boolean} complete
 * @property {string} description
 * @property {string} dueDate
 * @property {string[]} tags
 * @property {number} priority
 * @property {string} recurring
 * @property {string} createdAt
 * @property {string} completedAt
 * @property {SubItem[]} subItems
 */

/**
 * @typedef {Object} List
 * @property {string} id
 * @property {string} name
 * @property {string} color
 * @property {string} icon
 * @property {string} sortMode
 * @property {boolean} collapsed
 * @property {boolean} pinned
 * @property {Item[]} items
 */

/**
 * @typedef {Object} CustomTag
 * @property {string} id
 * @property {string} label
 * @property {string} color
 */

/**
 * @typedef {Object} AppSettings
 * @property {'light'|'dark'|'system'} darkMode
 * @property {string} lastBackupAt
 * @property {boolean} dismissedBackupReminder
 * @property {string[]} collapsedListIds
 * @property {string[]} pinnedListIds
 * @property {string} focusListId
 * @property {string} viewMode
 * @property {string} lastUsedListId
 * @property {string} kanbanGroupBy
 */

export {};
