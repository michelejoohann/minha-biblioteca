import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("photo registration captures cover and catalog page on mobile", async () => {
  const component = await readProjectFile(
    "src/app/biblioteca/livros/novo/foto/photo-registration.tsx",
  );

  assert.match(component, /Foto da capa/);
  assert.match(component, /Foto da ficha catalográfica/);
  assert.match(component, /capture="environment"/);
  assert.match(component, /import\("tesseract\.js"\)/);
  assert.match(component, /A página interna não é enviada ao\s+Supabase/);
  assert.match(component, /ManualBookForm/);
});

test("photo text extraction validates OCR ISBN before lookup", async () => {
  const extractor = await readProjectFile("src/lib/books/photo-extraction.ts");

  assert.match(extractor, /parseIsbn/);
  assert.match(extractor, /findPhotoIsbn/);
  assert.match(extractor, /publicationYear/);
  assert.match(extractor, /publisher/);
});

test("cover storage is private and limited to household member paths", async () => {
  const migration = await readProjectFile(
    "supabase/migrations/20260825142656_add_photo_book_registration.sql",
  );

  assert.match(migration, /'book-covers'/);
  assert.match(migration, /public,\s*file_size_limit/);
  assert.match(migration, /private\.is_household_member/);
  assert.match(migration, /storage\.foldername/);
  assert.match(migration, /security invoker/);
  assert.doesNotMatch(migration, /service_role/);
});

test("book creation validates and persists the uploaded cover path", async () => {
  const action = await readProjectFile("src/app/biblioteca/livros/novo/actions.ts");
  const migration = await readProjectFile(
    "supabase/migrations/20260825142656_add_photo_book_registration.sql",
  );

  assert.match(action, /coverPath\.startsWith\(`\$\{membership\.household_id\}\/\$\{userId\}\//);
  assert.match(action, /p_cover_path: coverPath/);
  assert.match(migration, /cover_path/);
  assert.match(migration, /split_part\(clean_cover_path, '\/', 1\)/);
});
