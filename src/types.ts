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
 * @property {number} recurringIntervalDays
 * @property {string} recurringEndDate
 * @property {string[]} blockedBy
 * @property {number} estimateMinutes
 * @property {Record<string, string|number|boolean>} customFieldValues
 * @property {string} snoozedUntil
 * @property {{ id: string; type: string; at: string; detail: string }[]} history
 * @property {string} createdAt
 * @property {string} lastTouchedAt
 * @property {string} completedAt
 * @property {SubItem[]} subItems
 */

/**
 * @typedef {{ id: string; label: string; type: 'text'|'url'|'number'|'checkbox' }} ListCustomField
 */

/**
 * @typedef {Object} List
 * @property {string} id
 * @property {string} name
 * @property {string} color
 * @property {string} icon
 * @property {string} theme
 * @property {string} parentId
 * @property {boolean} isFolder
 * @property {ListCustomField[]} customFields
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
 * @property {string} parentId
 * @property {string[]} aliases
 */

/**
 * @typedef {Object} ItemTemplate
 * @property {string} id
 * @property {string} name
 * @property {string} text
 * @property {string} description
 * @property {string[]} tags
 * @property {number} priority
 * @property {number} estimateMinutes
 * @property {{ text: string }[]} subItems
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
 * @property {{ id: string; name: string; searchQuery: string; itemFilter: string; tagFilter: string }[]} savedFilters
 * @property {boolean} streaksEnabled
 * @property {number} streakCurrent
 * @property {number} streakLongest
 * @property {string} streakLastGoodDate
 * @property {'comfortable'|'compact'} density
 * @property {'month'|'week'} calendarMode
 * @property {string} calendarAnchor
 * @property {string} inboxListId
 * @property {number} staleThresholdDays
 * @property {boolean} notificationsEnabled
 * @property {number} pomodoroMinutes
 * @property {number} pomodoroRemaining
 * @property {boolean} pomodoroRunning
 * @property {string} lastReviewAt
 * @property {string[]} expandedFolderIds
 */

export {};
