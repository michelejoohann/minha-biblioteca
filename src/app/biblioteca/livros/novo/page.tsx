import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ManualBookForm } from "./manual-book-form";

export default async function NewManualBookPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/biblioteca");
  }

  const [{ data: owners }, { data: locations }] = await Promise.all([
    supabase
      .from("owners")
      .select("id, name, is_collective")
      .eq("household_id", membership.household_id)
      .eq("is_active", true)
      .order("is_collective", { ascending: true })
      .order("name"),
    supabase
      .from("locations")
      .select("name")
      .eq("household_id", membership.household_id)
      .eq("is_active", true)
      .is("parent_id", null)
      .order("name"),
  ]);

  if (!owners?.length) {
    redirect("/biblioteca");
  }

  return (
    <main className="book-entry-page">
      <header className="entry-header">
        <Link className="back-link entry-back" href="/biblioteca">
          ← Voltar para a biblioteca
        </Link>
        <div className="library-brand">
          <span className="brand-mark" aria-hidden="true">MB</span>
          Minha Biblioteca
        </div>
      </header>

      <section className="entry-content">
        <div className="entry-intro">
          <span className="eyebrow">Cadastro manual</span>
          <h1>Adicionar um livro</h1>
          <p>
            Comece pelo essencial. Você poderá revisar todas as informações antes de salvar.
          </p>
        </div>

        <ManualBookForm
          locations={(locations ?? []).map((location) => location.name)}
          owners={owners.map((owner) => ({
            id: owner.id,
            isCollective: owner.is_collective,
            name: owner.name,
          }))}
        />
      </section>
    </main>
  );
}
