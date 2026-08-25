"use server";

import { redirect } from "next/navigation";
import { parseIsbn } from "@/lib/books/isbn";
import { createClient } from "@/lib/supabase/server";
import { getBookMetadataByIsbn, type BookMetadata } from "@/services/books";

export type PhotoMetadataResult = {
  found: boolean;
  message: string;
  metadata?: BookMetadata;
};

export async function lookupPhotoMetadata(isbn: string): Promise<PhotoMetadataResult> {
  const parsedIsbn = parseIsbn(isbn);

  if (!parsedIsbn) {
    return { found: false, message: "O número encontrado na foto não é um ISBN válido." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    redirect("/login");
  }

  try {
    const metadata = await getBookMetadataByIsbn(parsedIsbn);
    if (metadata) {
      return {
        found: true,
        message: "ISBN reconhecido e dados bibliográficos encontrados.",
        metadata,
      };
    }
  } catch {
    // The OCR result must remain usable even if a metadata provider is unavailable.
  }

  return {
    found: false,
    message: "ISBN reconhecido. Complete os campos que não foram encontrados automaticamente.",
  };
}
