# Ledger — Task Management System

A minor-project deliverable for the DudeX Innovations Web Development Internship.
Next.js 14 (App Router) + Supabase (Postgres, Auth, Realtime), styled with Tailwind.

## Features

- Email/password auth (Supabase Auth), auto-provisioned personal workspace on signup
- Boards (projects) within a workspace
- Kanban board with drag-and-drop (To do / In progress / Done) via `@dnd-kit`
- Task detail modal: description, priority, due date, comments
- **Realtime sync** — task moves/edits update live across open sessions (Supabase Realtime)
- **Activity log** — every status change is recorded (`task_activity` table) for a future timeline view
- Row Level Security: users only ever see data in workspaces they belong to

## 1. Set up Supabase

1. Create a project at https://supabase.com
2. Go to **SQL Editor** and run the entire contents of `supabase/schema.sql`
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key

## 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 3. Install and run locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to `/signup`.
Signing up automatically creates a personal workspace (via a Postgres trigger),
so you can create a board and start adding tasks immediately.

## 4. Deploy

Push this repo to GitHub, then import it on [Vercel](https://vercel.com/new):
- Add the same two environment variables in Vercel's project settings
- Deploy — Vercel builds and hosts the Next.js app; Supabase remains the backend

## Project structure

```
app/
  login/, signup/        — auth pages
  dashboard/              — board list
  dashboard/[projectId]/  — kanban board for one project
components/
  TopBar, KanbanColumn, TaskCard, TaskModal
lib/supabase.ts           — Supabase client + shared types
supabase/schema.sql       — tables, RLS policies, triggers
```

## Ideas for extending (stretch features for evaluation)

- Multi-member workspaces: build an "invite by email" flow on top of `workspace_members`
- Due-date email reminders via a Supabase Edge Function + Resend/SendGrid
- Analytics view: tasks completed per week / per assignee, using Recharts
- Render `task_activity` as a visible per-task timeline in the modal
