import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  const displayName = profile?.display_name ?? "Leitora";
  const email = typeof data.claims.email === "string" ? data.claims.email : "Conta conectada";

  return (
    <main className="library-page">
      <header className="library-header">
        <div className="library-brand">
          <span className="brand-mark" aria-hidden="true">MB</span>
          Minha Biblioteca
        </div>
        <form action={signOut}>
          <button className="secondary-button" type="submit">Sair</button>
        </form>
      </header>

      <section className="library-content">
        <div className="welcome-card">
          <span className="eyebrow">Área protegida</span>
          <h1>Olá, {displayName}.</h1>
          <p>
            Sua conta está conectada. No próximo passo, vamos preparar a casa da família e
            começar a organizar os primeiros livros.
          </p>
          <span className="account-chip">{email}</span>
        </div>
      </section>
    </main>
  );
}
