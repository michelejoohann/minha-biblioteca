import type { ParsedIsbn } from "@/lib/books/isbn";
import { OpenLibraryProvider } from "./open-library";
import type { BookMetadata, BookMetadataProvider } from "./types";

const provider: BookMetadataProvider = new OpenLibraryProvider();

export async function getBookMetadataByIsbn(isbn: ParsedIsbn): Promise<BookMetadata | null> {
  return provider.lookupByIsbn(isbn);
}

export type { BookMetadata } from "./types";

