import Link from "next/link";
import { redirect } from "next/navigation";
import { parseIsbn } from "@/lib/books/isbn";
import { createClient } from "@/lib/supabase/server";
import { IsbnRegistration } from "./isbn-registration";

export default async function IsbnBookPage({
  searchParams,
}: {
  searchParams: Promise<{ isbn?: string | string[] }>;
}) {
  const query = await searchParams;
  const queryIsbn = Array.isArray(query.isbn) ? query.isbn[0] : query.isbn;
  const initialIsbn = queryIsbn ? parseIsbn(queryIsbn)?.isbn13 : undefined;
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
          <span className="eyebrow">Cadastro rápido</span>
          <h1>Adicionar por ISBN</h1>
          <p>
            Busque os dados do livro e corrija o que precisar antes de cadastrar o exemplar.
          </p>
        </div>

        <IsbnRegistration
          initialIsbn={initialIsbn}
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

