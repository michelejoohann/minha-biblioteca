import type { ParsedIsbn } from "@/lib/books/isbn";

export type BookMetadata = ParsedIsbn & {
  authors: string[];
  description?: string;
  genres: string[];
  languageCode?: string;
  publicationYear?: number;
  publisher?: string;
  source: string;
  subtitle?: string;
  title: string;
};

export interface BookMetadataProvider {
  lookupByIsbn(isbn: ParsedIsbn): Promise<BookMetadata | null>;
}

