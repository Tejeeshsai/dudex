-- ============================================================
-- Ledger: Task Management System — Supabase schema
-- Run this in the Supabase SQL Editor (Project -> SQL Editor)
-- ============================================================

-- 1. Profiles (mirrors auth.users, holds display info)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. Workspaces
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- 3. Workspace membership
create table if not exists workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

-- 4. Projects (boards) within a workspace
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- 5. Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'med' check (priority in ('low', 'med', 'high')),
  assignee_id uuid references auth.users(id),
  due_date date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now()
);

-- 6. Task comments
create table if not exists task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  comment text not null,
  created_at timestamptz default now()
);

-- 7. Task activity log (for the timeline / "unique feature")
create table if not exists task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- Helper function: is the current user a member of a workspace?
-- ============================================================
create or replace function is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table task_comments enable row level security;
alter table task_activity enable row level security;

-- Profiles: anyone signed in can read; a user can only edit their own row
create policy "profiles are readable by authenticated users"
  on profiles for select using (auth.role() = 'authenticated');
create policy "users can update their own profile"
  on profiles for update using (auth.uid() = id);
create policy "users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- Workspaces: members can read; owner can update/delete
create policy "members can read their workspaces"
  on workspaces for select using (is_workspace_member(id) or owner_id = auth.uid());
create policy "authenticated users can create workspaces"
  on workspaces for insert with check (auth.uid() = owner_id);
create policy "owner can update workspace"
  on workspaces for update using (owner_id = auth.uid());
create policy "owner can delete workspace"
  on workspaces for delete using (owner_id = auth.uid());

-- Workspace members: members can see other members of their workspace
create policy "members can view membership"
  on workspace_members for select using (is_workspace_member(workspace_id));
create policy "workspace owner/admin can add members"
  on workspace_members for insert with check (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id and w.owner_id = auth.uid()
    )
    or user_id = auth.uid() -- allow self-join via invite flow
  );
create policy "workspace owner can remove members"
  on workspace_members for delete using (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id and w.owner_id = auth.uid()
    )
  );

-- Projects: members of the parent workspace can read/write
create policy "members can read projects"
  on projects for select using (is_workspace_member(workspace_id));
create policy "members can create projects"
  on projects for insert with check (is_workspace_member(workspace_id));
create policy "members can update projects"
  on projects for update using (is_workspace_member(workspace_id));
create policy "members can delete projects"
  on projects for delete using (is_workspace_member(workspace_id));

-- Tasks: members of the project's workspace can read/write
create policy "members can read tasks"
  on tasks for select using (
    exists (
      select 1 from projects p
      where p.id = project_id and is_workspace_member(p.workspace_id)
    )
  );
create policy "members can create tasks"
  on tasks for insert with check (
    exists (
      select 1 from projects p
      where p.id = project_id and is_workspace_member(p.workspace_id)
    )
  );
create policy "members can update tasks"
  on tasks for update using (
    exists (
      select 1 from projects p
      where p.id = project_id and is_workspace_member(p.workspace_id)
    )
  );
create policy "members can delete tasks"
  on tasks for delete using (
    exists (
      select 1 from projects p
      where p.id = project_id and is_workspace_member(p.workspace_id)
    )
  );

-- Task comments: same workspace-membership rule via task -> project -> workspace
create policy "members can read comments"
  on task_comments for select using (
    exists (
      select 1 from tasks t join projects p on p.id = t.project_id
      where t.id = task_id and is_workspace_member(p.workspace_id)
    )
  );
create policy "members can add comments"
  on task_comments for insert with check (
    user_id = auth.uid() and exists (
      select 1 from tasks t join projects p on p.id = t.project_id
      where t.id = task_id and is_workspace_member(p.workspace_id)
    )
  );

-- Task activity: read-only to members, inserted by triggers/app
create policy "members can read activity"
  on task_activity for select using (
    exists (
      select 1 from tasks t join projects p on p.id = t.project_id
      where t.id = task_id and is_workspace_member(p.workspace_id)
    )
  );
create policy "members can log activity"
  on task_activity for insert with check (
    exists (
      select 1 from tasks t join projects p on p.id = t.project_id
      where t.id = task_id and is_workspace_member(p.workspace_id)
    )
  );

-- ============================================================
-- Trigger: auto-create a profile row when a user signs up
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- Trigger: auto-create a personal workspace on signup (nice default)
-- ============================================================
create or replace function handle_new_user_workspace()
returns trigger
language plpgsql
security definer
as $$
declare
  new_ws_id uuid;
begin
  insert into public.workspaces (name, owner_id)
  values ('My Workspace', new.id)
  returning id into new_ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_ws_id, new.id, 'admin');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_workspace on auth.users;
create trigger on_auth_user_created_workspace
  after insert on auth.users
  for each row execute procedure handle_new_user_workspace();

-- ============================================================
-- Realtime: enable for tasks so the board updates live
-- ============================================================
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table task_comments;
