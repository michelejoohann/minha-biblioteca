"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

function textValue(formData: FormData, field: string, trim = true) {
  const value = formData.get(field);
  return typeof value === "string" ? (trim ? value.trim() : value) : "";
}

function validateCredentials(email: string, password: string) {
  if (!email || !email.includes("@")) {
    return "Informe um e-mail válido.";
  }

  if (password.length < 8) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }

  return null;
}

function friendlyAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (normalized.includes("user already registered")) {
    return "Este e-mail já possui uma conta.";
  }

  if (normalized.includes("rate limit")) {
    return "Muitas tentativas seguidas. Aguarde um pouco e tente novamente.";
  }

  return "Não foi possível concluir. Tente novamente em instantes.";
}

async function confirmationUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (configuredUrl) {
    return `${configuredUrl}/auth/confirm`;
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}/auth/confirm` : undefined;
}

export async function signIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = textValue(formData, "email").toLowerCase();
  const password = textValue(formData, "password", false);
  const validationError = validateCredentials(email, password);

  if (validationError) {
    return { message: validationError, status: "error" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { message: friendlyAuthError(error.message), status: "error" };
  }

  redirect("/biblioteca");
}

export async function signUp(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const displayName = textValue(formData, "displayName");
  const email = textValue(formData, "email").toLowerCase();
  const password = textValue(formData, "password", false);
  const validationError = validateCredentials(email, password);

  if (displayName.length < 2 || displayName.length > 100) {
    return { message: "Informe um nome entre 2 e 100 caracteres.", status: "error" };
  }

  if (validationError) {
    return { message: validationError, status: "error" };
  }

  const supabase = await createClient();
  const emailRedirectTo = await confirmationUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo,
    },
  });

  if (error) {
    return { message: friendlyAuthError(error.message), status: "error" };
  }

  if (data.session) {
    redirect("/biblioteca");
  }

  return {
    message: "Conta criada! Enviamos um link de confirmação para o seu e-mail.",
    status: "success",
  };
}

