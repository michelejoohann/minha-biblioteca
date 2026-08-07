create index households_created_by_idx
  on public.households (created_by);

create index locations_household_parent_idx
  on public.locations (household_id, parent_id)
  where parent_id is not null;

create index works_created_by_idx
  on public.works (created_by);

create index work_authors_household_work_idx
  on public.work_authors (household_id, work_id);

create index work_authors_household_author_idx
  on public.work_authors (household_id, author_id);

create index reading_statuses_household_owner_idx
  on public.reading_statuses (household_id, reader_owner_id);

create index loans_household_copy_idx
  on public.loans (household_id, copy_id);

create index wishlist_items_created_by_idx
  on public.wishlist_items (created_by);

