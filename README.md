 # Bookmark Manager

Next.js + Supabase + Google OAuth + Tailwind CSS

Simple, per-user bookmark manager with multi-tab sync.

## Features
- Google OAuth sign-in
- Add / view / delete bookmarks (title + URL)
- Each user sees only their bookmarks
- Instant sync across open tabs (BroadcastChannel)

## Quick Start

Prerequisites
- Node.js 18+
- A Supabase project

Install and run

```bash
git clone <repo>
cd bookmark
npm install
npm run dev
```

Environment variables (example in `.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Create `bookmarks` table (suggested schema)

```sql
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  user_id uuid not null,
  created_at timestamptz default now()
);
```

## Supabase Row-Level Security (RLS)

If RLS is enabled on the `bookmarks` table, you must add policies so authenticated users can read/insert/delete their own rows.

Recommended policies (SQL):

```sql
-- allow users to read only their own bookmarks
create policy "Users can read their bookmarks"
on public.bookmarks
for select
using (auth.uid() = user_id);

-- allow users to insert only bookmarks with their user_id
create policy "Users can insert their own bookmarks"
on public.bookmarks
for insert
with check (auth.uid() = user_id);

-- allow users to delete their own bookmarks
create policy "Users can delete their own bookmarks"
on public.bookmarks
for delete
using (auth.uid() = user_id);
```

If you see `new row violates row-level security policy` when inserting, add the INSERT policy above.

## Authentication and Redirect

The app uses Supabase Auth (Google OAuth). On login the app redirects to `/dashboard`.

Ensure your OAuth provider redirect URL includes:

```
https://your-site.com/dashboard
```

## Realtime / Multi-tab Sync

Originally Supabase Realtime (Postgres changes over websockets) was used, but in development it can time out or be unreliable. For reliable same-browser multi-tab syncing, this app uses the browser `BroadcastChannel` API:

```js
const channel = new BroadcastChannel('bookmarks-channel')
channel.postMessage({ type: 'bookmark-added' })
channel.onmessage = () => { fetchBookmarks() }
```

Why BroadcastChannel?
- Works out-of-the-box in modern browsers
- No extra server dependency
- Perfect for syncing multiple tabs of the same browser

If you need cross-device realtime (different machines/users/browsers), use Supabase Realtime or a websocket service.

## UI / Code Notes
- `app/dashboard/page.tsx` contains the dashboard UI and uses `fetchBookmarks()` and `BroadcastChannel` for sync.
- Bookmarks are stored with `user_id` and queries filter by the logged-in user's id.

## Troubleshooting
- RLS insert error: add the INSERT policy shown above.
- Realtime subscription `TIMED_OUT`: check network/WebSocket support or rely on `BroadcastChannel` for same-browser tabs.
- Bookmarks not showing after insert: verify the `user_id` is being passed on insert and RLS allows the operation.

## Deploy
Deploy with Vercel or any platform that supports Next.js. Add environment variables on the hosting platform.

