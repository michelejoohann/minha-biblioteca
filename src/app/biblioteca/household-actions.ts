"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type HouseholdActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

type ServerClient = Awaited<ReturnType<typeof createClient>>;

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  return { supabase, userId };
}

async function getHouseholdId(supabase: ServerClient, userId: string) {
  const { data, error } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível consultar a biblioteca familiar.");
  }

  return data?.household_id ?? null;
}

async function getHouseholdMembership(supabase: ServerClient, userId: string) {
  const { data, error } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível consultar sua permissão na biblioteca.");
  }

  return data;
}

function formText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function createHousehold(
  _previousState: HouseholdActionState,
  formData: FormData,
): Promise<HouseholdActionState> {
  const name = formText(formData, "householdName");

  if (name.length < 3 || name.length > 100) {
    return {
      message: "Escolha um nome entre 3 e 100 caracteres.",
      status: "error",
    };
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const currentHouseholdId = await getHouseholdId(supabase, userId);

  if (currentHouseholdId) {
    redirect("/biblioteca");
  }

  const { error } = await supabase.from("households").insert({
    created_by: userId,
    name,
  });

  if (error) {
    return {
      message: "Não foi possível criar a biblioteca. Tente novamente.",
      status: "error",
    };
  }

  revalidatePath("/biblioteca");
  redirect("/biblioteca");
}

export async function addOwner(
  _previousState: HouseholdActionState,
  formData: FormData,
): Promise<HouseholdActionState> {
  const name = formText(formData, "ownerName");

  if (name.length < 2 || name.length > 100) {
    return {
      message: "Informe um nome entre 2 e 100 caracteres.",
      status: "error",
    };
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const householdId = await getHouseholdId(supabase, userId);

  if (!householdId) {
    return {
      message: "Crie a biblioteca familiar antes de adicionar uma pessoa.",
      status: "error",
    };
  }

  const { error } = await supabase.from("owners").insert({
    household_id: householdId,
    name,
  });

  if (error?.code === "23505") {
    return { message: "Este nome já está na lista.", status: "error" };
  }

  if (error) {
    return {
      message: "Não foi possível adicionar. Tente novamente.",
      status: "error",
    };
  }

  revalidatePath("/biblioteca");
  return { message: `${name} foi adicionado(a).`, status: "success" };
}

export async function toggleOwner(formData: FormData) {
  const ownerId = formText(formData, "ownerId");

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerId)) {
    return;
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const householdId = await getHouseholdId(supabase, userId);

  if (!householdId) {
    redirect("/biblioteca");
  }

  const { data: owner } = await supabase
    .from("owners")
    .select("id, is_active")
    .eq("household_id", householdId)
    .eq("id", ownerId)
    .maybeSingle();

  if (!owner) {
    return;
  }

  await supabase
    .from("owners")
    .update({ is_active: !owner.is_active })
    .eq("household_id", householdId)
    .eq("id", ownerId);

  revalidatePath("/biblioteca");
}

export async function deleteOwner(
  _previousState: HouseholdActionState,
  formData: FormData,
): Promise<HouseholdActionState> {
  const ownerId = formText(formData, "ownerId");

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerId)) {
    return { message: "Proprietário inválido.", status: "error" };
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const membership = await getHouseholdMembership(supabase, userId);

  if (!membership || membership.role !== "admin") {
    return {
      message: "Somente administradores podem excluir proprietários.",
      status: "error",
    };
  }

  const { data: owner } = await supabase
    .from("owners")
    .select("id, name, user_id")
    .eq("household_id", membership.household_id)
    .eq("id", ownerId)
    .maybeSingle();

  if (!owner) {
    return { message: "Proprietário não encontrado.", status: "error" };
  }

  if (owner.user_id) {
    return {
      message: "Uma pessoa vinculada a uma conta não pode ser excluída.",
      status: "error",
    };
  }

  const [ownersResult, copiesResult, readingResult] = await Promise.all([
    supabase
      .from("owners")
      .select("id", { count: "exact", head: true })
      .eq("household_id", membership.household_id),
    supabase
      .from("copies")
      .select("id", { count: "exact", head: true })
      .eq("household_id", membership.household_id)
      .eq("owner_id", ownerId),
    supabase
      .from("reading_statuses")
      .select("id", { count: "exact", head: true })
      .eq("household_id", membership.household_id)
      .eq("reader_owner_id", ownerId),
  ]);

  if ((ownersResult.count ?? 0) <= 1) {
    return {
      message: "A biblioteca precisa manter pelo menos um proprietário.",
      status: "error",
    };
  }

  if ((copiesResult.count ?? 0) > 0 || (readingResult.count ?? 0) > 0) {
    return {
      message: "Este proprietário possui livros ou leituras vinculadas. Desative-o em vez de excluir.",
      status: "error",
    };
  }

  const { error } = await supabase
    .from("owners")
    .delete()
    .eq("household_id", membership.household_id)
    .eq("id", ownerId);

  if (error) {
    return {
      message: "Não foi possível excluir. Verifique se há dados vinculados.",
      status: "error",
    };
  }

  revalidatePath("/biblioteca");
  return { message: `${owner.name} foi excluído(a).`, status: "success" };
}

