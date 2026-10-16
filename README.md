# List App

Minimalist multi-list task manager. Runs as an installable web app on Mac and iPad, works offline, and syncs between devices through Supabase.

Live at **https://listapp.pwang19.workers.dev**.

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
- Sync across devices (email code sign-in via Supabase)
- Keyboard shortcuts: `/` search, `n` new list, `t` templates, `a` archive, `z` undo, `⌘Z`/`⌘⇧Z` redo, `⌘K` commands, `?` help
- Quick add syntax: `Buy milk #errand !2026-07-25 !p2`

## Install on a device

Open the live URL, then:

- **Mac (Safari):** File → Add to Dock.
- **Mac (Brave/Chrome):** the install icon at the right of the address bar.
- **iPad:** Share → Add to Home Screen.

Then tap the sync chip next to the 🌙 button and sign in with your email. Sign in from the installed app itself: on iPad, and for Safari's Add to Dock, the installed app has its own storage, separate from the browser's.

## Sync

Lists, archive, tags, and templates sync; display settings (dark mode, view, density, etc.) stay per device. Each user has one row in Supabase's `user_state` table holding all of their data. Edits upload about 2 seconds after you stop typing, and the app checks for the other device's changes on launch, on focus, and when it comes back online. If both devices edited while offline, the edits are merged by id and nothing is lost, though an item deleted on one device can come back. See `src/utils/sync.js` and `src/hooks/useSync.js`.

### Supabase setup

1. Run `supabase/schema.sql` in the SQL Editor (creates the table and row-level security policies).
2. Put the project URL and publishable key in `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Both are public by design; the data is protected by row-level security, not by keeping the key secret. The sync UI is hidden while either is empty.
3. **Authentication → URL Configuration:** set Site URL to the live URL.
4. **Authentication → Emails:** add `{{ .Token }}` to both the "Magic Link" and "Confirm signup" templates. The app signs in with a typed code rather than a link, because on iPad a link opens in Safari instead of the installed app.
5. Built-in email only delivers to members of the Supabase organization and allows a few emails per hour, which is enough for personal use. If you switch to Resend SMTP, its test sender `onboarding@resend.dev` only delivers to the Resend account's own email.
6. Once your devices are signed in, turn off **Allow new users to sign up** (Authentication → Sign In / Providers).

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:5173](http://localhost:5173).

On newer Node versions (seen on Node 26), Node's built-in `localStorage` hides the test environment's version and breaks the tests. Run them with:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm test
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server (Vite) |
| `npm test` | Vitest + Testing Library |
| `npm run build` | Production build in `dist/` |
| `npm run preview` | Preview production build |
| `npm run deploy` | Build and deploy to Cloudflare (`wrangler login` first) |

## Data model

Locally, lists persist under `listapp.lists`; archived items under `listapp.archived`; settings, custom tags, and user templates in separate keys. `listapp.syncMeta` records the last synced version, which is how the app detects edits that haven't been uploaded yet. The synced copy lives in Supabase (see [Sync](#sync)).

## Stack

React 19 · Vite · TypeScript types · @dnd-kit · Supabase · Vitest · Cloudflare Workers

## Deploy

Hosted as a static-assets Cloudflare Worker (`wrangler.jsonc`). Every push to `main` builds and deploys automatically through Cloudflare Workers Builds (build command `npm run build`, deploy command `npx wrangler deploy`). To deploy by hand, run `npm run deploy`.

The service worker (`public/sw.js`) loads the page from the network first, so a new deploy appears the next time the app is opened online. It only caches same-origin files, so sync requests always go to the network.
