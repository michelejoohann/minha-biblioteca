create or replace function public.create_manual_book(
  p_household_id uuid,
  p_title text,
  p_author text,
  p_owner_id uuid,
  p_location_name text,
  p_subtitle text default null,
  p_publisher text default null,
  p_edition_label text default null,
  p_publication_year smallint default null,
  p_language_code text default null,
  p_genres text[] default '{}',
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_work_id uuid;
  author_id uuid;
  new_edition_id uuid;
  location_id uuid;
  new_copy_id uuid;
  clean_title text := btrim(p_title);
  clean_author text := btrim(p_author);
  clean_location text := btrim(p_location_name);
  clean_genres text[];
begin
  if current_user_id is null
    or not (select private.is_household_member(p_household_id)) then
    raise exception using
      errcode = '42501',
      message = 'Usuário sem acesso a esta biblioteca.';
  end if;

  if clean_title is null or length(clean_title) not between 1 and 300 then
    raise exception using errcode = '22023', message = 'Título inválido.';
  end if;

  if clean_author is null or length(clean_author) not between 1 and 200 then
    raise exception using errcode = '22023', message = 'Autor inválido.';
  end if;

  if clean_location is null or length(clean_location) not between 1 and 120 then
    raise exception using errcode = '22023', message = 'Localização inválida.';
  end if;

  if not exists (
    select 1
    from public.owners
    where id = p_owner_id
      and household_id = p_household_id
      and is_active
  ) then
    raise exception using
      errcode = '22023',
      message = 'Proprietário inválido ou desativado.';
  end if;

  select coalesce(array_agg(distinct genre order by genre), '{}')
  into clean_genres
  from (
    select btrim(value) as genre
    from unnest(coalesce(p_genres, '{}')) as value
    where btrim(value) <> ''
  ) as normalized_genres;

  select id
  into author_id
  from public.authors
  where household_id = p_household_id
    and normalized_name = lower(clean_author)
  limit 1;

  if author_id is null then
    begin
      insert into public.authors (household_id, name)
      values (p_household_id, clean_author)
      returning id into author_id;
    exception
      when unique_violation then
        select id
        into author_id
        from public.authors
        where household_id = p_household_id
          and normalized_name = lower(clean_author)
        limit 1;
    end;
  end if;

  select id
  into location_id
  from public.locations
  where household_id = p_household_id
    and parent_id is null
    and lower(btrim(name)) = lower(clean_location)
  limit 1;

  if location_id is null then
    begin
      insert into public.locations (household_id, name)
      values (p_household_id, clean_location)
      returning id into location_id;
    exception
      when unique_violation then
        select id
        into location_id
        from public.locations
        where household_id = p_household_id
          and parent_id is null
          and lower(btrim(name)) = lower(clean_location)
        limit 1;
    end;
  end if;

  insert into public.works (
    household_id,
    title,
    subtitle,
    language_code,
    genres,
    created_by
  )
  values (
    p_household_id,
    clean_title,
    nullif(btrim(p_subtitle), ''),
    nullif(btrim(p_language_code), ''),
    clean_genres,
    current_user_id
  )
  returning id into new_work_id;

  insert into public.work_authors (household_id, work_id, author_id)
  values (p_household_id, new_work_id, author_id);

  insert into public.editions (
    household_id,
    work_id,
    publisher,
    edition_label,
    publication_year
  )
  values (
    p_household_id,
    new_work_id,
    nullif(btrim(p_publisher), ''),
    nullif(btrim(p_edition_label), ''),
    p_publication_year
  )
  returning id into new_edition_id;

  insert into public.copies (
    household_id,
    edition_id,
    owner_id,
    location_id,
    notes
  )
  values (
    p_household_id,
    new_edition_id,
    p_owner_id,
    location_id,
    nullif(btrim(p_notes), '')
  )
  returning id into new_copy_id;

  return new_copy_id;
end;
$$;

revoke all on function public.create_manual_book(
  uuid,
  text,
  text,
  uuid,
  text,
  text,
  text,
  text,
  smallint,
  text,
  text[],
  text
) from public, anon;

grant execute on function public.create_manual_book(
  uuid,
  text,
  text,
  uuid,
  text,
  text,
  text,
  text,
  smallint,
  text,
  text[],
  text
) to authenticated;
