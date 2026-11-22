-- ROADPULSE SUPABASE SETUP
-- Run this in Supabase Dashboard > SQL Editor.
-- Assumes the public.road_reports table already exists from the earlier setup.

-- 1) Add fields needed by the connected frontend (safe to run more than once).
alter table public.road_reports
  add column if not exists image_url text,
  add column if not exists updated_at timestamptz not null default now();

-- Align the allowed values with the categories and severities shown in this frontend.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.road_reports'::regclass
      and contype = 'c'
      and (pg_get_constraintdef(oid) ilike '%category%' or pg_get_constraintdef(oid) ilike '%severity%')
  loop
    execute format('alter table public.road_reports drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.road_reports
  add constraint road_reports_category_check
  check (category in ('Pothole','Damaged Road','Waterlogging','Traffic Signal','Road Obstruction'));
alter table public.road_reports
  add constraint road_reports_severity_check
  check (severity in ('Low','Medium','High','Critical'));

-- 2) Resident profiles. The role is assigned server-side; users cannot promote themselves.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Resident',
  role text not null default 'resident' check (role in ('resident','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_roadpulse_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name',''), split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_roadpulse_user_created on auth.users;
create trigger on_roadpulse_user_created
after insert on auth.users
for each row execute procedure public.handle_new_roadpulse_user();

create or replace function public.is_roadpulse_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_roadpulse_admin());

-- 3) Road report access.
alter table public.road_reports enable row level security;
drop policy if exists "Public can view road reports" on public.road_reports;
create policy "Public can view road reports"
on public.road_reports for select to anon, authenticated
using (true);

drop policy if exists "Users can submit their own reports" on public.road_reports;
create policy "Users can submit their own reports"
on public.road_reports for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Admins can update road reports" on public.road_reports;
create policy "Admins can update road reports"
on public.road_reports for update to authenticated
using (public.is_roadpulse_admin())
with check (public.is_roadpulse_admin());

drop policy if exists "Owners or admins can delete road reports" on public.road_reports;
create policy "Owners or admins can delete road reports"
on public.road_reports for delete to authenticated
using (user_id = (select auth.uid()) or public.is_roadpulse_admin());

-- 4) Community confirmations (one confirmation per resident per report).
create table if not exists public.report_confirmations (
  report_id uuid not null references public.road_reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);
alter table public.report_confirmations enable row level security;
drop policy if exists "Anyone can view report confirmations" on public.report_confirmations;
create policy "Anyone can view report confirmations"
on public.report_confirmations for select to anon, authenticated
using (true);
drop policy if exists "Residents can confirm reports once" on public.report_confirmations;
create policy "Residents can confirm reports once"
on public.report_confirmations for insert to authenticated
with check (user_id = (select auth.uid()));
drop policy if exists "Residents can remove own confirmations" on public.report_confirmations;
create policy "Residents can remove own confirmations"
on public.report_confirmations for delete to authenticated
using (user_id = (select auth.uid()));

-- 5) Storage: public can view; signed-in users can upload only into their own folder.
-- The bucket road-photos should already exist and be marked Public in Storage.
drop policy if exists "Authenticated users can upload road photos" on storage.objects;
create policy "Authenticated users can upload road photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'road-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "Anyone can view road photos" on storage.objects;
create policy "Anyone can view road photos"
on storage.objects for select to anon, authenticated
using (bucket_id = 'road-photos');

-- 6) Promote the first administrator only AFTER creating that account through RoadPulse.
-- Replace the email below with the email used for your intended admin account, then run separately:
-- update public.profiles p set role = 'admin'
-- from auth.users u where p.id = u.id and lower(u.email) = lower('YOUR_ADMIN_EMAIL');
