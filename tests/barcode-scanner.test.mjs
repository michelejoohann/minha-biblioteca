import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  decodeEan13FromBinary,
  decodeEan13FromGrayscale,
  isValidEan13,
} from "../src/lib/books/ean13.ts";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const leftPatterns = [
  "0001101",
  "0011001",
  "0010011",
  "0111101",
  "0100011",
  "0110001",
  "0101111",
  "0111011",
  "0110111",
  "0001011",
];
const alternatePatterns = [
  "0100111",
  "0110011",
  "0011011",
  "0100001",
  "0011101",
  "0111001",
  "0000101",
  "0010001",
  "0001001",
  "0010111",
];
const parity = [
  "LLLLLL",
  "LLGLGG",
  "LLGGLG",
  "LLGGGL",
  "LGLLGG",
  "LGGLLG",
  "LGGGLL",
  "LGLGLG",
  "LGLGGL",
  "LGGLGL",
];

function encodeEan13(value, pixelsPerModule = 3) {
  const digits = [...value].map(Number);
  const left = digits
    .slice(1, 7)
    .map((digit, index) =>
      parity[digits[0]][index] === "L"
        ? leftPatterns[digit]
        : alternatePatterns[digit],
    )
    .join("");
  const right = digits
    .slice(7)
    .map((digit) =>
      [...leftPatterns[digit]].map((bit) => (bit === "0" ? "1" : "0")).join(""),
    )
    .join("");
  const modules = `000000000000101${left}01010${right}101000000000000`;
  return [...modules].flatMap((bit) =>
    new Array(pixelsPerModule).fill(Number(bit)),
  );
}

test("EAN-13 decoder recognizes a valid book ISBN in both directions", () => {
  const isbn = "9780306406157";
  const barcode = encodeEan13(isbn);

  assert.equal(isValidEan13(isbn), true);
  assert.equal(decodeEan13FromBinary(barcode), isbn);
  assert.equal(decodeEan13FromBinary([...barcode].reverse()), isbn);
  assert.equal(
    decodeEan13FromGrayscale(barcode.map((bit) => (bit ? 25 : 235))),
    isbn,
  );
  assert.equal(isValidEan13("9780306406158"), false);
});

test("camera access only starts from the explicit user action", async () => {
  const scanner = await readProjectFile(
    "src/app/biblioteca/livros/novo/scanner/barcode-scanner.tsx",
  );

  assert.equal(scanner.match(/getUserMedia\(/g)?.length, 1);
  assert.match(scanner, /async function startCamera\(\)/);
  assert.match(scanner, /onClick=\{startCamera\}/);
  assert.match(scanner, /A câmera permanece desligada/);
});

test("scanner sends recognized ISBN to lookup and keeps a manual fallback", async () => {
  const scanner = await readProjectFile(
    "src/app/biblioteca/livros/novo/scanner/barcode-scanner.tsx",
  );
  const isbnForm = await readProjectFile(
    "src/app/biblioteca/livros/novo/isbn/isbn-registration.tsx",
  );

  assert.match(scanner, /biblioteca\/livros\/novo\/isbn\?isbn=/);
  assert.match(scanner, /Prefere digitar\?/);
  assert.match(scanner, /NotAllowedError/);
  assert.match(scanner, /configurações deste site/);
  assert.match(isbnForm, /requestSubmit\(\)/);
});

test("application explicitly limits camera permission to its own origin", async () => {
  const config = await readProjectFile("next.config.ts");
  assert.match(config, /camera=\(self\), microphone=\(\)/);
});

