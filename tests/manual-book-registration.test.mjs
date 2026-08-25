import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("manual registration writes through one atomic database function", async () => {
  const action = await readProjectFile(
    "src/app/biblioteca/livros/novo/actions.ts",
  );

  assert.match(action, /auth\.getClaims\(\)/);
  assert.match(action, /rpc\("create_manual_book"/);
  assert.doesNotMatch(action, /from\("works"\)\.insert/);
  assert.doesNotMatch(action, /auth\.getSession\(\)/);
});

test("database function persists work, edition and copy with least privilege", async () => {
  const migration = await readProjectFile(
    "supabase/migrations/20260807171740_create_manual_book_function.sql",
  );

  assert.match(migration, /security invoker/);
  assert.doesNotMatch(migration, /security definer/);
  assert.match(migration, /private\.is_household_member/);
  assert.match(migration, /insert into public\.works/);
  assert.match(migration, /insert into public\.editions/);
  assert.match(migration, /insert into public\.copies/);
  assert.match(migration, /revoke all on function public\.create_manual_book/);
  assert.match(migration, /to authenticated/);
});

test("manual form includes a review step before persistence", async () => {
  const form = await readProjectFile(
    "src/app/biblioteca/livros/novo/manual-book-form.tsx",
  );

  assert.match(form, /Confira antes de salvar/);
  assert.match(form, /Corrigir informações/);
  assert.match(form, /Confirmar e salvar/);
  assert.match(form, /Proprietário/);
  assert.match(form, /Localização/);
  assert.match(form, /href="\/biblioteca"/);
  assert.doesNotMatch(form, /window\.location\.reload/);
});

