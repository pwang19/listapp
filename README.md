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
- Sync across devices (email code sign-in via Supabase), with conflict merging and version history
- Daily 8am reminders for items due today and overdue (web push)
- Keyboard shortcuts: `/` search, `n` new list, `t` templates, `a` archive, `z` undo, `⌘Z`/`⌘⇧Z` redo, `⌘K` commands, `?` help
- Quick add syntax: `Buy milk #errand !2026-07-25 !p2`

## Install on a device

Open the live URL, then:

- **Mac (Safari):** File → Add to Dock.
- **Mac (Brave/Chrome):** the install icon at the right of the address bar.
- **iPad:** Share → Add to Home Screen.

Then tap the sync chip next to the 🌙 button and sign in with your email. Sign in from the installed app itself: on iPad, and for Safari's Add to Dock, the installed app has its own storage, separate from the browser's.

## Sync

Lists, archive, tags, templates, and content preferences (saved views, inbox list, stale threshold, pomodoro length, streaks, last weekly review) sync. Display settings (dark mode, density, view mode, collapsed state) stay per device. Each user has one row in Supabase's `user_state` table holding all of their data. Edits upload about 2 seconds after you stop typing, and the app checks for the other device's changes on launch, on focus, and when it comes back online. See `src/utils/sync.js` and `src/hooks/useSync.js`.

**Conflicts.** Each device keeps the last copy it agreed on with the server (`listapp.syncBase`). If both devices edited while one was offline, the app compares each copy against that shared base:
- Deletions, moves, archiving, and reordering on either device stick.
- If both devices edited different fields of the same item, both edits are kept. If both changed the same field, this device's edit wins.
- An item edited on one device and deleted on the other is kept.

**Version history.** The server keeps an earlier copy at most every 10 minutes, and the newest 100 copies. You can restore one from Sync → Earlier versions. The restore is applied as a normal edit, so you can undo it with ⌘Z.

### Daily reminders

At 8am local time, each device that turned on **Daily reminder** in the Sync dialog gets one notification listing what's due today and what's overdue. Nothing is sent on days with nothing due. If an hourly run is missed, the reminder still goes out any time up to noon.

- On iPad and iPhone, this only works in the app installed on the Home Screen.
- In Brave, turn on "Use Google services for push messaging" in Brave's settings.

How it works:
- The app saves the device's push subscription in `push_subscriptions` (see `src/utils/push.js`).
- An hourly cron job calls the `send-reminders` Supabase function, which builds the message with `supabase/functions/send-reminders/reminder.js` and sends it via web push.
- The service worker shows the notification.

**Setup** (after `schema.sql` is run):

1. Install the Supabase CLI (`brew install supabase/tap/supabase`), then run `supabase login` and `supabase link --project-ref yhiwujxrqfqupjoyezti`.
2. Upload the secrets with `supabase secrets set --env-file supabase/functions/.env`. That file holds `VAPID_KEYS`, `VAPID_CONTACT`, and `CRON_SECRET`; it's git-ignored and was generated alongside `VITE_VAPID_PUBLIC_KEY` in `.env`, and the two halves of the key pair must match.
3. Deploy with `supabase functions deploy send-reminders --no-verify-jwt`. The function checks `CRON_SECRET` itself, so it doesn't need a Supabase login token.
4. Run `supabase/cron.local.sql` in the SQL Editor. It's the git-ignored copy of `supabase/cron.sql` with the secret filled in, and it schedules the job hourly at :05.
5. To test without waiting for 8am:
   ```bash
   curl -X POST "https://yhiwujxrqfqupjoyezti.supabase.co/functions/v1/send-reminders?force=1" -H "x-cron-secret: $(grep ^CRON_SECRET= supabase/functions/.env | cut -d= -f2)"
   ```
   This sends to every subscribed device now (if anything is due). It returns counts such as `{"sent":1,...}`.

### Supabase setup

1. Run `supabase/schema.sql` in the SQL Editor. It creates the tables, the history trigger, and the row-level security policies, and it's safe to re-run.
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

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server (Vite) |
| `npm test` | Vitest + Testing Library |
| `npm run lint` | ESLint (errors on undefined names and hook misuse; runs in CI) |
| `npm run build` | Production build in `dist/` |
| `npm run preview` | Preview production build |
| `npm run deploy` | Build and deploy to Cloudflare (`wrangler login` first) |

## Data model

Locally, lists persist under `listapp.lists`; archived items under `listapp.archived`; settings, custom tags, and user templates in separate keys. `listapp.syncMeta` records the last synced version, which is how the app detects edits that haven't been uploaded yet. The synced copy lives in Supabase (see [Sync](#sync)).

## Stack

React 19 · Vite · TypeScript types · @dnd-kit · Supabase (Postgres, Auth, Edge Functions, pg_cron) · Web Push · Vitest · ESLint · Cloudflare Workers

## Deploy

Hosted as a static-assets Cloudflare Worker (`wrangler.jsonc`). Every push to `main` builds and deploys automatically through Cloudflare Workers Builds (build command `npm run build`, deploy command `npx wrangler deploy`). To deploy by hand, run `npm run deploy`.

The service worker (`public/sw.js`) loads the page from the network first, so a new deploy appears the next time the app is opened online. It only caches same-origin files, so sync requests always go to the network.
