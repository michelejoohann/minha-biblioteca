import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { publishableKey, url } = getSupabaseConfig();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Keep this call immediately after creating the client. It validates the JWT
  // signature and refreshes cookies when necessary.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const isLibraryRoute = request.nextUrl.pathname.startsWith("/biblioteca");

  function redirectWithUpdatedCookies(url: URL) {
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  if (!isAuthenticated && isLibraryRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return redirectWithUpdatedCookies(loginUrl);
  }

  if (isAuthenticated && request.nextUrl.pathname === "/login") {
    const libraryUrl = request.nextUrl.clone();
    libraryUrl.pathname = "/biblioteca";
    libraryUrl.search = "";
    return redirectWithUpdatedCookies(libraryUrl);
  }

  return response;
}
