import type { ParsedIsbn } from "@/lib/books/isbn";
import type { BookMetadata, BookMetadataProvider } from "./types";

type OpenLibraryDocument = {
  author_name?: string[];
  first_sentence?: string | string[];
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

type OpenLibraryEdition = {
  authors?: Array<{ name?: string }>;
  publish_date?: string;
  publishers?: Array<{ name?: string }>;
  subjects?: Array<{ name?: string }>;
  subtitle?: string;
  title?: string;
};

type OpenLibraryEditionResponse = Record<string, OpenLibraryEdition>;

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

function publicationYear(value?: string) {
  const year = value?.match(/\b(1[4-9]\d{2}|20\d{2}|21\d{2})\b/)?.[1];
  return year ? Number(year) : undefined;
}

async function fetchEdition(isbn: ParsedIsbn) {
  const keys = [isbn.isbn13, isbn.isbn10]
    .filter((value): value is string => Boolean(value))
    .map((value) => `ISBN:${value}`);
  const url = new URL("https://openlibrary.org/api/books");
  url.searchParams.set("bibkeys", keys.join(","));
  url.searchParams.set("format", "json");
  url.searchParams.set("jscmd", "data");

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "MinhaBiblioteca/0.1 (family library lookup)",
    },
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`Open Library respondeu com ${response.status}.`);
  }

  const payload = (await response.json()) as OpenLibraryEditionResponse;
  return keys.map((key) => payload[key]).find(Boolean);
}

async function fetchSearchDocument(isbn: ParsedIsbn) {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("isbn", isbn.isbn13);
  url.searchParams.set(
    "fields",
    "title,subtitle,author_name,publisher,first_publish_year,language,subject,first_sentence",
  );
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "MinhaBiblioteca/0.1 (family library lookup)",
    },
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`Open Library respondeu com ${response.status}.`);
  }

  const payload = (await response.json()) as OpenLibraryResponse;
  return payload.docs?.[0];
}

export class OpenLibraryProvider implements BookMetadataProvider {
  async lookupByIsbn(isbn: ParsedIsbn): Promise<BookMetadata | null> {
    const [editionResult, searchResult] = await Promise.allSettled([
      fetchEdition(isbn),
      fetchSearchDocument(isbn),
    ]);
    const edition = editionResult.status === "fulfilled" ? editionResult.value : undefined;
    const document = searchResult.status === "fulfilled" ? searchResult.value : undefined;
    const title = edition?.title ?? document?.title ?? "";

    const editionAuthors = (edition?.authors ?? [])
      .map((author) => author.name?.trim())
      .filter((name): name is string => Boolean(name));
    const editionSubjects = (edition?.subjects ?? [])
      .map((subject) => subject.name?.trim())
      .filter((name): name is string => Boolean(name));
    const authors = (
      editionAuthors.length ? editionAuthors : document?.author_name ?? []
    ).slice(0, 8);
    const genres = (
      editionSubjects.length ? editionSubjects : document?.subject ?? []
    ).slice(0, 12);
    const publisher = edition?.publishers?.[0]?.name ?? document?.publisher?.[0];
    const year = publicationYear(edition?.publish_date) ?? document?.first_publish_year;
    const subtitle = edition?.subtitle ?? document?.subtitle;
    const languageCode = normalizeLanguage(document?.language?.[0]);
    const firstSentence = Array.isArray(document?.first_sentence)
      ? document.first_sentence[0]
      : document?.first_sentence;

    if (
      !title &&
      authors.length === 0 &&
      genres.length === 0 &&
      !publisher &&
      !year &&
      !subtitle &&
      !languageCode &&
      !firstSentence
    ) {
      return null;
    }

    return {
      ...isbn,
      authors,
      description: firstSentence,
      genres,
      languageCode,
      publicationYear: year,
      publisher,
      source: "Open Library",
      subtitle,
      title,
    };
  }
}

