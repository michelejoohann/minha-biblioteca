export type ParsedIsbn = {
  isbn10?: string;
  isbn13: string;
  normalized: string;
};

export function normalizeIsbn(value: string) {
  return value.toUpperCase().replace(/[^0-9X]/g, "");
}

export function isValidIsbn10(value: string) {
  if (!/^[0-9]{9}[0-9X]$/.test(value)) {
    return false;
  }

  const sum = [...value].reduce((total, character, index) => {
    const digit = character === "X" ? 10 : Number(character);
    return total + digit * (10 - index);
  }, 0);

  return sum % 11 === 0;
}

export function isValidIsbn13(value: string) {
  if (!/^[0-9]{13}$/.test(value)) {
    return false;
  }

  const sum = [...value.slice(0, 12)].reduce(
    (total, character, index) => total + Number(character) * (index % 2 === 0 ? 1 : 3),
    0,
  );
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(value[12]);
}

function isbn10To13(isbn10: string) {
  const base = `978${isbn10.slice(0, 9)}`;
  const sum = [...base].reduce(
    (total, character, index) => total + Number(character) * (index % 2 === 0 ? 1 : 3),
    0,
  );
  return `${base}${(10 - (sum % 10)) % 10}`;
}

function isbn13To10(isbn13: string) {
  if (!isbn13.startsWith("978")) {
    return undefined;
  }

  const base = isbn13.slice(3, 12);
  const sum = [...base].reduce(
    (total, character, index) => total + Number(character) * (10 - index),
    0,
  );
  const remainder = (11 - (sum % 11)) % 11;
  const checkDigit = remainder === 10 ? "X" : String(remainder);
  return `${base}${checkDigit}`;
}

export function parseIsbn(input: string): ParsedIsbn | null {
  const normalized = normalizeIsbn(input);

  if (normalized.length === 10 && isValidIsbn10(normalized)) {
    return {
      isbn10: normalized,
      isbn13: isbn10To13(normalized),
      normalized,
    };
  }

  if (normalized.length === 13 && isValidIsbn13(normalized)) {
    return {
      isbn10: isbn13To10(normalized),
      isbn13: normalized,
      normalized,
    };
  }

  return null;
}

