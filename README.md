# List App

Minimalist multi-list task manager with local persistence.

## Features

- Multiple lists with items, markdown notes, sub-items, due dates, tags, priority, and recurring tasks
- Custom tags (create your own in item details)
- Drag-and-drop reorder for lists, items, and sub-items (keyboard accessible)
- Views: Grid, All items, Kanban, Upcoming/overdue
- Search, status filter (All / Active / Completed), and tag filter
- Bulk select: complete, archive, move, add tag
- Undo/redo history (last 10 actions) with toast
- Archive shelf with restore
- List collapse, pin, duplicate, save as template, share link, export markdown
- Move and duplicate items between lists
- Dark mode (toggle or system preference)
- Command palette (⌘K)
- JSON replace/merge import, file upload, drag-drop JSON, auto-backup to Indexed localStorage
- Print / share as Markdown
- PWA installable with offline service worker
- Keyboard shortcuts: `/` search, `n` new list, `t` templates, `a` archive, `z` undo, `⌘Z`/`⌘⇧Z` redo, `⌘K` commands, `?` help
- Quick add syntax: `Buy milk #errand !2026-07-25 !p2`

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server (Vite) |
| `npm test` | Vitest + Testing Library |
| `npm run build` | Production build in `dist/` |
| `npm run preview` | Preview production build |

## Data model

Lists persist under `listapp.lists`; archived items under `listapp.archived`; settings, custom tags, and user templates in separate keys.

## Stack

React 19 · Vite · TypeScript types · @dnd-kit · Vitest

## Deploy

Static host the `dist/` folder (Vercel, Netlify, or GitHub Pages).
