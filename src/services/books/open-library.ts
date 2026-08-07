import type { ParsedIsbn } from "@/lib/books/isbn";
import type { BookMetadata, BookMetadataProvider } from "./types";

type OpenLibraryDocument = {
  author_name?: string[];
  first_publish_year?: number;
  language?: string[];
  publisher?: string[];
  subject?: string[];
  subtitle?: string;
  title?: string;
};

type OpenLibraryResponse = {
  docs?: OpenLibraryDocument[];
};

function normalizeLanguage(language?: string) {
  const languages: Record<string, string> = {
    eng: "en",
    fre: "fr",
    fra: "fr",
    por: "pt-BR",
    spa: "es",
  };
  return language ? languages[language] : undefined;
}

export class OpenLibraryProvider implements BookMetadataProvider {
  async lookupByIsbn(isbn: ParsedIsbn): Promise<BookMetadata | null> {
    const url = new URL("https://openlibrary.org/search.json");
    url.searchParams.set("isbn", isbn.normalized);
    url.searchParams.set(
      "fields",
      "title,subtitle,author_name,publisher,first_publish_year,language,subject",
    );
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MinhaBiblioteca/0.1 (family library lookup)",
      },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      throw new Error(`Open Library respondeu com ${response.status}.`);
    }

    const payload = (await response.json()) as OpenLibraryResponse;
    const document = payload.docs?.[0];

    if (!document?.title) {
      return null;
    }

    return {
      ...isbn,
      authors: (document.author_name ?? []).slice(0, 8),
      genres: (document.subject ?? []).slice(0, 12),
      languageCode: normalizeLanguage(document.language?.[0]),
      publicationYear: document.first_publish_year,
      publisher: document.publisher?.[0],
      source: "Open Library",
      subtitle: document.subtitle,
      title: document.title,
    };
  }
}

