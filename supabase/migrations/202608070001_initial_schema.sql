create extension if not exists pgcrypto;

create schema if not exists private;

revoke all on schema private from public;

create type public.household_role as enum ('admin', 'member');
create type public.reading_state as enum (
  'unread',
  'want_to_read',
  'reading',
  'read',
  'abandoned'
);
create type public.wishlist_state as enum ('wanted', 'purchased', 'removed');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 100),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.household_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index household_members_user_id_idx
  on public.household_members (user_id, household_id);

create table public.owners (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (length(btrim(name)) between 1 and 100),
  is_collective boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, id)
);

create unique index owners_household_name_key
  on public.owners (household_id, lower(btrim(name)));

create index owners_user_id_idx on public.owners (user_id) where user_id is not null;

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  parent_id uuid,
  name text not null check (length(btrim(name)) between 1 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, id),
  constraint locations_parent_household_fk
    foreign key (household_id, parent_id)
    references public.locations (household_id, id)
    on delete restrict
);

create unique index locations_household_parent_name_key
  on public.locations (
    household_id,
    coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(btrim(name))
  );

create table public.works (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 300),
  normalized_title text generated always as (lower(btrim(title))) stored,
  subtitle text,
  description text,
  language_code text check (language_code is null or language_code ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  genres text[] not null default '{}',
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, id)
);

create index works_household_title_idx
  on public.works (household_id, normalized_title);

create table public.authors (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 200),
  normalized_name text generated always as (lower(btrim(name))) stored,
  created_at timestamptz not null default now(),
  unique (household_id, id)
);

create unique index authors_household_name_key
  on public.authors (household_id, normalized_name);

create table public.work_authors (
  household_id uuid not null,
  work_id uuid not null,
  author_id uuid not null,
  position smallint not null default 1 check (position > 0),
  primary key (work_id, author_id),
  constraint work_authors_household_fk
    foreign key (household_id)
    references public.households (id)
    on delete cascade,
  constraint work_authors_work_fk
    foreign key (household_id, work_id)
    references public.works (household_id, id)
    on delete cascade,
  constraint work_authors_author_fk
    foreign key (household_id, author_id)
    references public.authors (household_id, id)
    on delete cascade
);

create index work_authors_author_idx on public.work_authors (author_id, work_id);

create table public.editions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  work_id uuid not null,
  isbn_10 text check (isbn_10 is null or isbn_10 ~ '^[0-9]{9}[0-9X]$'),
  isbn_13 text check (isbn_13 is null or isbn_13 ~ '^[0-9]{13}$'),
  publisher text,
  edition_label text,
  publication_year smallint check (publication_year is null or publication_year between 1400 and 2200),
  format text,
  cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, id),
  constraint editions_work_fk
    foreign key (household_id, work_id)
    references public.works (household_id, id)
    on delete cascade
);

create unique index editions_household_isbn_10_key
  on public.editions (household_id, isbn_10)
  where isbn_10 is not null;

create unique index editions_household_isbn_13_key
  on public.editions (household_id, isbn_13)
  where isbn_13 is not null;

create index editions_household_work_idx on public.editions (household_id, work_id);

create table public.copies (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  edition_id uuid not null,
  owner_id uuid not null,
  location_id uuid not null,
  condition text,
  notes text,
  acquired_on date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, id),
  constraint copies_household_fk
    foreign key (household_id)
    references public.households (id)
    on delete cascade,
  constraint copies_edition_fk
    foreign key (household_id, edition_id)
    references public.editions (household_id, id)
    on delete restrict,
  constraint copies_owner_fk
    foreign key (household_id, owner_id)
    references public.owners (household_id, id)
    on delete restrict,
  constraint copies_location_fk
    foreign key (household_id, location_id)
    references public.locations (household_id, id)
    on delete restrict
);

create index copies_household_owner_idx on public.copies (household_id, owner_id);
create index copies_household_location_idx on public.copies (household_id, location_id);
create index copies_household_edition_idx on public.copies (household_id, edition_id);

create table public.reading_statuses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  work_id uuid not null,
  reader_owner_id uuid not null,
  status public.reading_state not null default 'unread',
  started_on date,
  finished_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_statuses_work_fk
    foreign key (household_id, work_id)
    references public.works (household_id, id)
    on delete cascade,
  constraint reading_statuses_owner_fk
    foreign key (household_id, reader_owner_id)
    references public.owners (household_id, id)
    on delete cascade,
  constraint reading_statuses_dates_check
    check (finished_on is null or started_on is null or finished_on >= started_on),
  unique (household_id, work_id, reader_owner_id)
);

create index reading_statuses_household_status_idx
  on public.reading_statuses (household_id, status);

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  copy_id uuid not null,
  borrower_name text not null check (length(btrim(borrower_name)) between 1 and 150),
  borrower_contact text,
  loaned_on date not null default current_date,
  due_on date,
  returned_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loans_copy_fk
    foreign key (household_id, copy_id)
    references public.copies (household_id, id)
    on delete restrict,
  constraint loans_dates_check
    check (
      (due_on is null or due_on >= loaned_on)
      and (returned_on is null or returned_on >= loaned_on)
    )
);

create unique index loans_one_active_per_copy_key
  on public.loans (copy_id)
  where returned_on is null;

create index loans_household_active_idx
  on public.loans (household_id, loaned_on)
  where returned_on is null;

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 300),
  normalized_title text generated always as (lower(btrim(title))) stored,
  authors text[] not null default '{}',
  isbn_10 text check (isbn_10 is null or isbn_10 ~ '^[0-9]{9}[0-9X]$'),
  isbn_13 text check (isbn_13 is null or isbn_13 ~ '^[0-9]{13}$'),
  priority smallint not null default 3 check (priority between 1 and 5),
  status public.wishlist_state not null default 'wanted',
  notes text,
  created_by uuid not null references auth.users (id) on delete restrict,
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wishlist_items_household_status_idx
  on public.wishlist_items (household_id, status, priority);
create index wishlist_items_household_isbn_10_idx
  on public.wishlist_items (household_id, isbn_10)
  where isbn_10 is not null;
create index wishlist_items_household_isbn_13_idx
  on public.wishlist_items (household_id, isbn_13)
  where isbn_13 is not null;
create index wishlist_items_household_title_idx
  on public.wishlist_items (household_id, normalized_title);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.preserve_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by <> old.created_by then
    raise exception 'created_by cannot be changed';
  end if;
  return new;
end;
$$;

create or replace function private.is_household_member(requested_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = requested_household_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function private.is_household_admin(requested_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = requested_household_id
      and user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Leitor'
    )
  );
  return new;
end;
$$;

create or replace function private.handle_new_household()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.household_members (household_id, user_id, role)
  values (new.id, new.created_by, 'admin');

  insert into public.owners (household_id, name, is_collective)
  values
    (new.id, 'Michele', false),
    (new.id, 'Ayra', false),
    (new.id, 'Fabio', false),
    (new.id, 'Denise', false),
    (new.id, 'Casa', true);

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger households_set_updated_at
before update on public.households
for each row execute function private.set_updated_at();

create trigger owners_set_updated_at
before update on public.owners
for each row execute function private.set_updated_at();

create trigger locations_set_updated_at
before update on public.locations
for each row execute function private.set_updated_at();

create trigger works_set_updated_at
before update on public.works
for each row execute function private.set_updated_at();

create trigger works_preserve_created_by
before update on public.works
for each row execute function private.preserve_created_by();

create trigger editions_set_updated_at
before update on public.editions
for each row execute function private.set_updated_at();

create trigger copies_set_updated_at
before update on public.copies
for each row execute function private.set_updated_at();

create trigger reading_statuses_set_updated_at
before update on public.reading_statuses
for each row execute function private.set_updated_at();

create trigger loans_set_updated_at
before update on public.loans
for each row execute function private.set_updated_at();

create trigger wishlist_items_set_updated_at
before update on public.wishlist_items
for each row execute function private.set_updated_at();

create trigger wishlist_items_preserve_created_by
before update on public.wishlist_items
for each row execute function private.preserve_created_by();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create trigger on_household_created
after insert on public.households
for each row execute function private.handle_new_household();

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.owners enable row level security;
alter table public.locations enable row level security;
alter table public.works enable row level security;
alter table public.authors enable row level security;
alter table public.work_authors enable row level security;
alter table public.editions enable row level security;
alter table public.copies enable row level security;
alter table public.reading_statuses enable row level security;
alter table public.loans enable row level security;
alter table public.wishlist_items enable row level security;

create policy "Users can read their profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Members can read households"
on public.households for select to authenticated
using ((select private.is_household_member(id)));

create policy "Users can create households"
on public.households for insert to authenticated
with check ((select auth.uid()) is not null and created_by = (select auth.uid()));

create policy "Admins can update households"
on public.households for update to authenticated
using ((select private.is_household_admin(id)))
with check ((select private.is_household_admin(id)));

create policy "Admins can delete households"
on public.households for delete to authenticated
using ((select private.is_household_admin(id)));

create policy "Members can read household memberships"
on public.household_members for select to authenticated
using ((select private.is_household_member(household_id)));

create policy "Admins can add household members"
on public.household_members for insert to authenticated
with check ((select private.is_household_admin(household_id)));

create policy "Admins can update household members"
on public.household_members for update to authenticated
using ((select private.is_household_admin(household_id)))
with check ((select private.is_household_admin(household_id)));

create policy "Admins can remove household members"
on public.household_members for delete to authenticated
using (
  (select private.is_household_admin(household_id))
  and user_id <> (select auth.uid())
);

create policy "Members can read owners"
on public.owners for select to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can create owners"
on public.owners for insert to authenticated
with check ((select private.is_household_member(household_id)));

create policy "Members can update owners"
on public.owners for update to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create policy "Admins can delete unused owners"
on public.owners for delete to authenticated
using ((select private.is_household_admin(household_id)));

create policy "Members can read locations"
on public.locations for select to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can create locations"
on public.locations for insert to authenticated
with check ((select private.is_household_member(household_id)));

create policy "Members can update locations"
on public.locations for update to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create policy "Admins can delete unused locations"
on public.locations for delete to authenticated
using ((select private.is_household_admin(household_id)));

create policy "Members can read works"
on public.works for select to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can create works"
on public.works for insert to authenticated
with check (
  (select private.is_household_member(household_id))
  and created_by = (select auth.uid())
);

create policy "Members can update works"
on public.works for update to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create policy "Members can delete works"
on public.works for delete to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can manage authors"
on public.authors for all to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create policy "Members can manage work authors"
on public.work_authors for all to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create policy "Members can manage editions"
on public.editions for all to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create policy "Members can manage copies"
on public.copies for all to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create policy "Members can manage reading statuses"
on public.reading_statuses for all to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create policy "Members can manage loans"
on public.loans for all to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create policy "Members can read wishlist items"
on public.wishlist_items for select to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can create wishlist items"
on public.wishlist_items for insert to authenticated
with check (
  (select private.is_household_member(household_id))
  and created_by = (select auth.uid())
);

create policy "Members can update wishlist items"
on public.wishlist_items for update to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create policy "Members can delete wishlist items"
on public.wishlist_items for delete to authenticated
using ((select private.is_household_member(household_id)));

grant usage on schema public to authenticated;
grant usage on schema private to authenticated;
grant usage on type
  public.household_role,
  public.reading_state,
  public.wishlist_state
to authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.households,
  public.household_members,
  public.owners,
  public.locations,
  public.works,
  public.authors,
  public.work_authors,
  public.editions,
  public.copies,
  public.reading_statuses,
  public.loans,
  public.wishlist_items
to authenticated;

revoke all on all functions in schema private from public;
grant execute on function private.set_updated_at() to authenticated;
grant execute on function private.preserve_created_by() to authenticated;
grant execute on function private.is_household_member(uuid) to authenticated;
grant execute on function private.is_household_admin(uuid) to authenticated;
