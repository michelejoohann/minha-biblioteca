import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("catalog search is household-scoped and protected by verified claims", async () => {
  const page = await readProjectFile("src/app/biblioteca/livros/page.tsx");
  const migration = await readProjectFile(
    "supabase/migrations/20260825133229_search_library_books.sql",
  );

  assert.match(page, /auth\.getClaims\(\)/);
  assert.match(page, /rpc\("search_library_books"/);
  assert.match(page, /p_household_id: membership\.household_id/);
  assert.match(migration, /security invoker/);
  assert.doesNotMatch(migration, /security definer/);
  assert.match(migration, /private\.is_household_member\(p_household_id\)/);
  assert.match(migration, /copies\.household_id = p_household_id/);
  assert.match(migration, /revoke all on function public\.search_library_books/);
  assert.match(migration, /grant execute[\s\S]*to authenticated/);
});

test("catalog supports book and physical-location searches", async () => {
  const page = await readProjectFile("src/app/biblioteca/livros/page.tsx");
  const migration = await readProjectFile(
    "supabase/migrations/20260825133229_search_library_books.sql",
  );

  assert.match(page, /Buscar no acervo/);
  assert.match(page, /book\.title/);
  assert.match(page, /book\.authors/);
  assert.match(page, /book\.owner_name/);
  assert.match(page, /book\.location_name/);
  assert.match(migration, /catalog\.title ilike/);
  assert.match(migration, /catalog\.authors ilike/);
  assert.match(migration, /catalog\.isbn_13 like/);
  assert.match(migration, /catalog\.owner_name ilike/);
  assert.match(migration, /catalog\.location_name ilike/);
});

