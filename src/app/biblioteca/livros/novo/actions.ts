"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ManualBookActionState = {
  copyId?: string;
  message: string;
  status: "error" | "idle" | "success";
};

function formText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function createManualBook(
  _previousState: ManualBookActionState,
  formData: FormData,
): Promise<ManualBookActionState> {
  const title = formText(formData, "title");
  const subtitle = formText(formData, "subtitle");
  const author = formText(formData, "author");
  const ownerId = formText(formData, "ownerId");
  const locationName = formText(formData, "locationName");
  const publisher = formText(formData, "publisher");
  const editionLabel = formText(formData, "editionLabel");
  const publicationYearText = formText(formData, "publicationYear");
  const languageCode = formText(formData, "languageCode");
  const genresText = formText(formData, "genres");
  const notes = formText(formData, "notes");

  if (title.length < 1 || title.length > 300) {
    return { message: "Informe um título com até 300 caracteres.", status: "error" };
  }

  if (author.length < 1 || author.length > 200) {
    return { message: "Informe o nome do autor.", status: "error" };
  }

  if (!isUuid(ownerId)) {
    return { message: "Escolha um proprietário válido.", status: "error" };
  }

  if (locationName.length < 1 || locationName.length > 120) {
    return { message: "Informe onde o livro fica guardado.", status: "error" };
  }

  let publicationYear: number | undefined;
  if (publicationYearText) {
    publicationYear = Number(publicationYearText);
    if (!Number.isInteger(publicationYear) || publicationYear < 1400 || publicationYear > 2200) {
      return { message: "Informe um ano entre 1400 e 2200.", status: "error" };
    }
  }

  if (languageCode && !/^[a-z]{2,3}(-[A-Z]{2})?$/.test(languageCode)) {
    return { message: "Use um idioma como pt-BR, en ou es.", status: "error" };
  }

  const genres = [...new Set(
    genresText
      .split(",")
      .map((genre) => genre.trim())
      .filter(Boolean),
  )].slice(0, 12);

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      message: "Crie sua biblioteca familiar antes de cadastrar um livro.",
      status: "error",
    };
  }

  const { data: copyId, error } = await supabase.rpc("create_manual_book", {
    p_author: author,
    p_edition_label: editionLabel,
    p_genres: genres,
    p_household_id: membership.household_id,
    p_language_code: languageCode,
    p_location_name: locationName,
    p_notes: notes,
    p_owner_id: ownerId,
    ...(publicationYear === undefined ? {} : { p_publication_year: publicationYear }),
    p_publisher: publisher,
    p_subtitle: subtitle,
    p_title: title,
  });

  if (error) {
    const unauthorized = error.code === "42501";
    return {
      message: unauthorized
        ? "Você não tem permissão para cadastrar nesta biblioteca."
        : "Não foi possível salvar o livro. Revise os dados e tente novamente.",
      status: "error",
    };
  }

  revalidatePath("/biblioteca");
  return {
    copyId,
    message: `${title} foi adicionado à biblioteca.`,
    status: "success",
  };
}
