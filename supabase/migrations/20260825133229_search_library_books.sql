create or replace function public.search_library_books(
  p_household_id uuid,
  p_query text default '',
  p_limit integer default 100
)
returns table (
  copy_id uuid,
  title text,
  subtitle text,
  authors text,
  owner_name text,
  location_name text,
  isbn_10 text,
  isbn_13 text,
  publisher text,
  publication_year smallint,
  genres text[],
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with catalog as (
    select
      copies.id as copy_id,
      works.title,
      works.subtitle,
      coalesce(author_list.authors, '') as authors,
      owners.name as owner_name,
      locations.name as location_name,
      editions.isbn_10,
      editions.isbn_13,
      editions.publisher,
      editions.publication_year,
      works.genres,
      copies.created_at
    from public.copies
    join public.editions
      on editions.household_id = copies.household_id
      and editions.id = copies.edition_id
    join public.works
      on works.household_id = editions.household_id
      and works.id = editions.work_id
    join public.owners
      on owners.household_id = copies.household_id
      and owners.id = copies.owner_id
    join public.locations
      on locations.household_id = copies.household_id
      and locations.id = copies.location_id
    left join lateral (
      select string_agg(authors.name, ', ' order by work_authors.position) as authors
      from public.work_authors
      join public.authors
        on authors.household_id = work_authors.household_id
        and authors.id = work_authors.author_id
      where work_authors.household_id = works.household_id
        and work_authors.work_id = works.id
    ) as author_list on true
    where copies.household_id = p_household_id
      and copies.archived_at is null
  ),
  input as (
    select
      btrim(coalesce(p_query, '')) as query,
      regexp_replace(coalesce(p_query, ''), '[^0-9Xx]', '', 'g') as isbn_query
  )
  select
    catalog.copy_id,
    catalog.title,
    catalog.subtitle,
    catalog.authors,
    catalog.owner_name,
    catalog.location_name,
    catalog.isbn_10,
    catalog.isbn_13,
    catalog.publisher,
    catalog.publication_year,
    catalog.genres,
    catalog.created_at
  from catalog
  cross join input
  where (select private.is_household_member(p_household_id))
    and (
      input.query = ''
      or catalog.title ilike '%' || input.query || '%'
      or catalog.subtitle ilike '%' || input.query || '%'
      or catalog.authors ilike '%' || input.query || '%'
      or catalog.owner_name ilike '%' || input.query || '%'
      or catalog.location_name ilike '%' || input.query || '%'
      or (
        input.isbn_query <> ''
        and (
          catalog.isbn_10 like '%' || upper(input.isbn_query) || '%'
          or catalog.isbn_13 like '%' || input.isbn_query || '%'
        )
      )
    )
  order by lower(catalog.title), catalog.copy_id
  limit least(greatest(coalesce(p_limit, 100), 1), 200);
$$;

revoke all on function public.search_library_books(uuid, text, integer)
from public, anon;

grant execute on function public.search_library_books(uuid, text, integer)
to authenticated;

