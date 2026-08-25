import type { ParsedIsbn } from "@/lib/books/isbn";
import { BrasilApiProvider } from "./brasil-api";
import { OpenLibraryProvider } from "./open-library";
import type { BookMetadata, BookMetadataProvider } from "./types";

const providers: BookMetadataProvider[] = [
  new OpenLibraryProvider(),
  new BrasilApiProvider(),
];

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function mergeBookMetadata(results: BookMetadata[]): BookMetadata | null {
  const [first, ...remaining] = results;

  if (!first) {
    return null;
  }

  return remaining.reduce<BookMetadata>(
    (merged, result) => ({
      ...merged,
      authors: unique([...merged.authors, ...result.authors]).slice(0, 8),
      description: merged.description || result.description,
      genres: unique([...merged.genres, ...result.genres]).slice(0, 12),
      languageCode: merged.languageCode || result.languageCode,
      publicationYear: merged.publicationYear || result.publicationYear,
      publisher: merged.publisher || result.publisher,
      source: unique([...merged.source.split(" + "), result.source]).join(" + "),
      subtitle: merged.subtitle || result.subtitle,
      title: merged.title || result.title,
    }),
    first,
  );
}

export async function getBookMetadataByIsbn(isbn: ParsedIsbn): Promise<BookMetadata | null> {
  const settled = await Promise.allSettled(
    providers.map((provider) => provider.lookupByIsbn(isbn)),
  );
  const results = settled.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [result.value] : [],
  );

  return mergeBookMetadata(results);
}

export type { BookMetadata } from "./types";

