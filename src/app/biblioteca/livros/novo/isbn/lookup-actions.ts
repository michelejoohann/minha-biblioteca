"use server";

import { redirect } from "next/navigation";
import { parseIsbn, type ParsedIsbn } from "@/lib/books/isbn";
import { createClient } from "@/lib/supabase/server";
import {
  getBookMetadataByIsbn,
  type BookMetadata,
} from "@/services/books";

export type IsbnLookupState = {
  found?: boolean;
  isbn?: ParsedIsbn;
  message: string;
  metadata?: BookMetadata;
  status: "error" | "idle" | "ready";
};

export async function lookupIsbn(
  _previousState: IsbnLookupState,
  formData: FormData,
): Promise<IsbnLookupState> {
  const input = formData.get("isbn");
  const parsedIsbn = parseIsbn(typeof input === "string" ? input : "");

  if (!parsedIsbn) {
    return {
      message: "Digite um ISBN-10 ou ISBN-13 válido.",
      status: "error",
    };
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
        isbn: parsedIsbn,
        message: "Encontramos informações para este ISBN. Revise antes de salvar.",
        metadata,
        status: "ready",
      };
    }
  } catch {
    // A provider outage must not block a manual registration.
  }

  return {
    found: false,
    isbn: parsedIsbn,
    message: "Não encontramos os dados automaticamente. Você pode preencher tudo manualmente.",
    status: "ready",
  };
}

