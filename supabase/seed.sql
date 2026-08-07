-- Seed idempotente para ambientes locais que já possuam um household.
-- Em ambientes novos, o trigger on_household_created cria estes registros.
insert into public.owners (household_id, name, is_collective)
select household.id, default_owner.name, default_owner.is_collective
from public.households as household
cross join (
  values
    ('Michele', false),
    ('Ayra', false),
    ('Fabio', false),
    ('Denise', false),
    ('Casa', true)
) as default_owner(name, is_collective)
where not exists (
  select 1
  from public.owners as existing_owner
  where existing_owner.household_id = household.id
    and lower(btrim(existing_owner.name)) = lower(btrim(default_owner.name))
);

