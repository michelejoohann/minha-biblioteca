import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  isValidIsbn10,
  isValidIsbn13,
  normalizeIsbn,
  parseIsbn,
} from "../src/lib/books/isbn.ts";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("normalizes and validates ISBN-10 and ISBN-13 check digits", () => {
  assert.equal(normalizeIsbn("978-0-306-40615-7"), "9780306406157");
  assert.equal(isValidIsbn10("0306406152"), true);
  assert.equal(isValidIsbn13("9780306406157"), true);
  assert.equal(isValidIsbn13("9780306406158"), false);
});

test("converts equivalent ISBN-10 and ISBN-13 values", () => {
  assert.deepEqual(parseIsbn("0-306-40615-2"), {
    isbn10: "0306406152",
    isbn13: "9780306406157",
    normalized: "0306406152",
  });
  assert.deepEqual(parseIsbn("9780306406157"), {
    isbn10: "0306406152",
    isbn13: "9780306406157",
    normalized: "9780306406157",
  });
  assert.equal(parseIsbn("ISBN inválido"), null);
});

test("external metadata lookup is isolated behind a replaceable provider", async () => {
  const service = await readProjectFile("src/services/books/index.ts");
  const provider = await readProjectFile("src/services/books/open-library.ts");
  const brasilApi = await readProjectFile("src/services/books/brasil-api.ts");

  assert.match(service, /BookMetadataProvider/);
  assert.match(service, /OpenLibraryProvider/);
  assert.match(service, /BrasilApiProvider/);
  assert.match(service, /Promise\.allSettled/);
  assert.match(service, /mergeBookMetadata/);
  assert.match(provider, /openlibrary\.org\/search\.json/);
  assert.match(provider, /openlibrary\.org\/api\/books/);
  assert.match(provider, /Promise\.allSettled/);
  assert.match(provider, /editionAuthors\.length/);
  assert.match(provider, /publicationYear\(edition\?\.publish_date\)/);
  assert.match(provider, /first_sentence/);
  assert.match(provider, /authors\.length === 0/);
  assert.match(provider, /!languageCode/);
  assert.match(provider, /description: firstSentence/);
  assert.match(provider, /cache: "no-store"/);
  assert.match(brasilApi, /brasilapi\.com\.br\/api\/isbn\/v1/);
  assert.match(brasilApi, /cache: "no-store"/);
  assert.match(brasilApi, /response\.status === 400 \|\| response\.status === 404/);
  assert.match(brasilApi, /description/);
  assert.doesNotMatch(brasilApi, /api[_-]?key/i);
});

test("ISBN metadata is passed to editable form fields", async () => {
  const registration = await readProjectFile(
    "src/app/biblioteca/livros/novo/isbn/isbn-registration.tsx",
  );

  for (const field of [
    "title",
    "author",
    "subtitle",
    "publisher",
    "publicationYear",
    "languageCode",
    "genres",
    "description",
  ]) {
    assert.match(registration, new RegExp(`${field}: metadata`));
  }

  assert.match(registration, /Preenchido automaticamente:/);
  assert.match(registration, /Fontes consultadas:/);
  assert.match(registration, /key=\{state\.isbn\.isbn13\}/);
});

test("provider failure still opens an editable manual registration", async () => {
  const action = await readProjectFile(
    "src/app/biblioteca/livros/novo/isbn/lookup-actions.ts",
  );
  const registration = await readProjectFile(
    "src/app/biblioteca/livros/novo/isbn/isbn-registration.tsx",
  );

  assert.match(action, /catch \{/);
  assert.match(action, /found: false/);
  assert.match(action, /status: "ready"/);
  assert.match(registration, /ManualBookForm/);
  assert.match(registration, /initialDraft/);
});

test("database function accepts ISBN and description with least privilege", async () => {
  const migration = await readProjectFile(
    "supabase/migrations/20260807172921_add_isbn_to_manual_book_function.sql",
  );

  assert.match(migration, /p_isbn_10 text default null/);
  assert.match(migration, /p_isbn_13 text default null/);
  assert.match(migration, /p_description text default null/);
  assert.match(migration, /security invoker/);
  assert.match(migration, /revoke all on function public\.create_manual_book/);
  assert.match(migration, /to authenticated/);
});

