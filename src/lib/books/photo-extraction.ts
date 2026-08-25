import { parseIsbn, type ParsedIsbn } from "./isbn";

export type PhotoTextDraft = {
  author: string;
  editionLabel: string;
  isbn?: ParsedIsbn;
  publicationYear: string;
  publisher: string;
  title: string;
};

const ignoredCoverLines = /^(editora|publisher|isbn|edição|edition|livro|book)$/i;

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").replace(/^[|:;,.\-–—]+|[|:;,.\-–—]+$/g, "").trim();
}

function findLabeledValue(text: string, labels: string[]) {
  const labelPattern = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = text.match(new RegExp(`(?:${labelPattern})\\s*[:\\-–—]\\s*([^\\n]{2,200})`, "i"));
  return match ? cleanLine(match[1]) : "";
}

export function findPhotoIsbn(text: string) {
  const candidates = text.match(/(?:ISBN(?:-1[03])?\s*[:\-]?\s*)?[0-9X][0-9X\s\-]{8,24}[0-9X]/gi) ?? [];

  for (const candidate of candidates) {
    const parsed = parseIsbn(candidate.replace(/^ISBN(?:-1[03])?\s*[:\-]?\s*/i, ""));
    if (parsed) return parsed;
  }

  return undefined;
}

export function extractPhotoTextDraft(coverText: string, detailsText: string): PhotoTextDraft {
  const combinedText = `${coverText}\n${detailsText}`;
  const coverLines = coverText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => line.length >= 2 && line.length <= 180 && !ignoredCoverLines.test(line));

  const labeledTitle = findLabeledValue(combinedText, ["título", "titulo", "title"]);
  const labeledAuthor = findLabeledValue(combinedText, ["autor", "autora", "author", "por", "by"]);
  const publisher = findLabeledValue(detailsText, ["editora", "publisher", "publicado por", "published by"]);
  const editionLabel = findLabeledValue(detailsText, ["edição", "edicao", "edition"]);
  const yearMatch = detailsText.match(
    /(?:copyright|©|publica(?:ção|cao)|edi(?:ção|cao)|impress(?:ão|ao))?[^0-9\n]{0,24}((?:14|15|16|17|18|19|20|21)\d{2})/i,
  );
  const possibleTitle = coverLines.find((line) => !findPhotoIsbn(line)) ?? "";

  return {
    author: labeledAuthor,
    editionLabel,
    isbn: findPhotoIsbn(combinedText),
    publicationYear: yearMatch?.[1] ?? "",
    publisher,
    title: labeledTitle || possibleTitle,
  };
}
