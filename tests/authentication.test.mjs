import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("protected routes validate JWT claims instead of trusting the local session", async () => {
  const proxy = await readProjectFile("src/lib/supabase/proxy.ts");

  assert.match(proxy, /auth\.getClaims\(\)/);
  assert.doesNotMatch(proxy, /auth\.getSession\(\)/);
  assert.match(proxy, /startsWith\("\/biblioteca"\)/);
});

test("email and password authentication is implemented with public clients", async () => {
  const actions = await readProjectFile("src/app/login/actions.ts");

  assert.match(actions, /auth\.signInWithPassword/);
  assert.match(actions, /auth\.signUp/);
  assert.match(actions, /display_name/);
  assert.doesNotMatch(actions, /service_role|secretKey|SUPABASE_SECRET/i);
});

test("email confirmation exchanges the token before entering the library", async () => {
  const confirmationRoute = await readProjectFile("src/app/auth/confirm/route.ts");

  assert.match(confirmationRoute, /auth\.verifyOtp/);
  assert.match(confirmationRoute, /token_hash/);
  assert.match(confirmationRoute, /\/biblioteca/);
});
