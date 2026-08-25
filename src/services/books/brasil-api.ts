import type { ParsedIsbn } from "@/lib/books/isbn";
import type { BookMetadata, BookMetadataProvider } from "./types";

type BrasilApiBook = {
  authors?: string[] | null;
  provider?: string | null;
  publisher?: string | null;
  subjects?: string[] | null;
  subtitle?: string | null;
  synopsis?: string | null;
  title?: string | null;
  year?: number | null;
};

function isBrazilianIsbn(isbn13: string) {
  return /^97[89](?:65|85)/.test(isbn13);
}

function cleanList(values?: string[] | null) {
  return (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean);
}

export class BrasilApiProvider implements BookMetadataProvider {
  async lookupByIsbn(isbn: ParsedIsbn): Promise<BookMetadata | null> {
    if (!isBrazilianIsbn(isbn.isbn13)) {
      return null;
    }

    const response = await fetch(
      `https://brasilapi.com.br/api/isbn/v1/${encodeURIComponent(isbn.isbn13)}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "User-Agent": "MinhaBiblioteca/0.1 (family library lookup)",
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (response.status === 400 || response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`BrasilAPI respondeu com ${response.status}.`);
    }

    const book = (await response.json()) as BrasilApiBook;
    const authors = cleanList(book.authors).slice(0, 8);
    const genres = cleanList(book.subjects).slice(0, 12);
    const title = book.title?.trim() ?? "";
    const subtitle = book.subtitle?.trim() || undefined;
    const publisher = book.publisher?.trim() || undefined;
    const description = book.synopsis?.trim() || undefined;
    const publicationYear = Number.isInteger(book.year) ? book.year ?? undefined : undefined;

    if (
      !title &&
      authors.length === 0 &&
      genres.length === 0 &&
      !subtitle &&
      !publisher &&
      !description &&
      !publicationYear
    ) {
      return null;
    }

    return {
      ...isbn,
      authors,
      description,
      genres,
      publicationYear,
      publisher,
      source: book.provider ? `BrasilAPI (${book.provider})` : "BrasilAPI",
      subtitle,
      title,
    };
  }
}

