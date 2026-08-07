import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("household actions derive identity from verified claims", async () => {
  const actions = await readProjectFile("src/app/biblioteca/household-actions.ts");

  assert.match(actions, /auth\.getClaims\(\)/);
  assert.match(actions, /claims\?\.sub/);
  assert.doesNotMatch(actions, /auth\.getSession\(\)/);
});

test("household creation relies on the atomic database trigger", async () => {
  const actions = await readProjectFile("src/app/biblioteca/household-actions.ts");
  const migration = await readProjectFile(
    "supabase/migrations/202608070001_initial_schema.sql",
  );

  assert.match(actions, /from\("households"\)\.insert/);
  assert.match(migration, /create trigger on_household_created/);

  for (const owner of ["Michele", "Ayra", "Fabio", "Denise", "Casa"]) {
    assert.match(migration, new RegExp(`'${owner}'`));
  }
});

test("owner management stays scoped to the authenticated household", async () => {
  const actions = await readProjectFile("src/app/biblioteca/household-actions.ts");

  assert.match(actions, /from\("household_members"\)/);
  assert.match(actions, /\.eq\("user_id", userId\)/);
  assert.match(actions, /\.eq\("household_id", householdId\)/);
  assert.match(actions, /is_active: !owner\.is_active/);
});
