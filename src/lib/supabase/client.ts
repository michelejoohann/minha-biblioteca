import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const { publishableKey, url } = getSupabaseConfig();

  return createBrowserClient<Database>(url, publishableKey);
}
