import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const { publishableKey, url } = getSupabaseConfig();

  return createBrowserClient(url, publishableKey);
}

