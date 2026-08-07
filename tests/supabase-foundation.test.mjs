import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/202608070001_initial_schema.sql",
  import.meta.url,
);
const envExampleUrl = new URL("../.env.example", import.meta.url);

test("all exposed tables enable row level security", async () => {
  const migration = await readFile(migrationUrl, "utf8");
  const tableNames = [
    "profiles",
    "households",
    "household_members",
    "owners",
    "locations",
    "works",
    "authors",
    "work_authors",
    "editions",
    "copies",
    "reading_statuses",
    "loans",
    "wishlist_items",
  ];

  for (const tableName of tableNames) {
    assert.match(
      migration,
      new RegExp(`alter table public\\.${tableName} enable row level security;`),
      `${tableName} must have RLS enabled`,
    );
  }
});

test("family owners are part of the reproducible setup", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  for (const owner of ["Michele", "Ayra", "Fabio", "Denise", "Casa"]) {
    assert.match(migration, new RegExp(`'${owner}'`));
  }
});

test("authorization is based on household membership", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  assert.match(migration, /private\.is_household_member/);
  assert.match(migration, /private\.is_household_admin/);
  assert.doesNotMatch(migration, /to anon/);
});

test("environment example contains public placeholders only", async () => {
  const envExample = await readFile(envExampleUrl, "utf8");

  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/);
  assert.doesNotMatch(envExample, /^SUPABASE_SERVICE_ROLE_KEY=/m);
});
