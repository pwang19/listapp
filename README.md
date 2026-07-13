# List App

Minimalist multi-list task manager with local persistence.

## Features

- Multiple lists with items, markdown notes, sub-items, due dates, and tags
- Drag-and-drop reorder for lists, items, and sub-items
- Search, status filter (All / Active / Completed), and tag filter
- Undo history (last 10 actions) with toast
- Archive shelf with restore
- List color + emoji icon
- Starter templates (Grocery, Packing, Reading)
- JSON replace/merge import, copy/download export
- Print / share as Markdown
- Keyboard shortcuts: `/` search, `n` new list, `t` templates, `a` archive, `z` undo, `?` help

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server |
| `npm test` | Jest + Testing Library |
| `npm run build` | Production build in `build/` |

## Data model

Lists persist under `listapp.lists`; archived items under `listapp.archived`.

```json
[
  {
    "id": "uuid",
    "name": "Groceries",
    "color": "green",
    "icon": "🛒",
    "items": [
      {
        "id": "uuid",
        "text": "Milk",
        "complete": false,
        "description": "**2%** gallon",
        "dueDate": "2026-07-20",
        "tags": ["errand"],
        "subItems": [{ "id": "uuid", "text": "Organic", "complete": false }]
      }
    ]
  }
]
```

## Deploy

Static host the `build/` folder (Vercel, Netlify, or GitHub Pages).

## Stack

React 19 · Create React App · @dnd-kit · PropTypes · Jest
