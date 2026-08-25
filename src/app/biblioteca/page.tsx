import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { toggleOwner } from "./household-actions";
import { AddOwnerForm, CreateHouseholdForm } from "./household-forms";
import { OwnerDeleteForm } from "./owner-delete-form";

function LibraryHeader() {
  return (
    <header className="library-header">
      <div className="library-brand">
        <span className="brand-mark" aria-hidden="true">MB</span>
        Minha Biblioteca
      </div>
      <form action={signOut}>
        <button className="secondary-button" type="submit">Sair</button>
      </form>
    </header>
  );
}

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle(),
  ]);

  const displayName = profile?.display_name ?? "Leitora";

  if (!membership) {
    return (
      <main className="library-page">
        <LibraryHeader />
        <section className="library-content">
          <div className="setup-card">
            <span className="eyebrow">Primeiro passo</span>
            <h1>Vamos preparar sua biblioteca, {displayName}?</h1>
            <p>
              Ao criar a biblioteca familiar, Michele, Ayra, Fabio, Denise e Casa já serão
              adicionados como proprietários iniciais.
            </p>
            <CreateHouseholdForm />
          </div>
        </section>
      </main>
    );
  }

  const [{ data: household }, { data: owners }] = await Promise.all([
    supabase
      .from("households")
      .select("name")
      .eq("id", membership.household_id)
      .single(),
    supabase
      .from("owners")
      .select("id, name, is_active, is_collective")
      .eq("household_id", membership.household_id)
      .order("is_active", { ascending: false })
      .order("is_collective", { ascending: true })
      .order("name"),
  ]);

  const ownerList = owners ?? [];
  const activeOwners = ownerList.filter((owner) => owner.is_active).length;
  const email = typeof data.claims.email === "string" ? data.claims.email : "Conta conectada";
  const isAdmin = membership.role === "admin";

  return (
    <main className="library-page">
      <LibraryHeader />
      <section className="library-content dashboard-grid">
        <div className="welcome-card dashboard-welcome">
          <span className="eyebrow">{household?.name ?? "Biblioteca familiar"}</span>
          <h1>Olá, {displayName}.</h1>
          <p>
            Sua biblioteca está pronta. Agora você já pode organizar quem é dono de cada
            exemplar antes de cadastrar os primeiros livros.
          </p>
          <span className="account-chip">{email}</span>
        </div>

        <div className="summary-card" aria-label="Resumo da biblioteca">
          <span className="summary-number">{activeOwners}</span>
          <span className="summary-label">proprietários ativos</span>
          <span className="summary-note">Incluindo a coleção da Casa</span>
        </div>

        <details className="owners-card owners-disclosure" open>
          <summary className="section-heading owners-summary">
            <div>
              <span className="eyebrow">Organização</span>
              <h2>Proprietários</h2>
            </div>
            <span className="owner-summary-meta">
              <span className="owner-count">{ownerList.length} no total</span>
              <span className="owner-toggle-label owner-toggle-expanded">Recolher</span>
              <span className="owner-toggle-label owner-toggle-collapsed">Expandir</span>
            </span>
          </summary>

          <div className="owners-content">
            <ul className="owner-list">
              {ownerList.map((owner) => (
                <li className={owner.is_active ? "" : "inactive-owner"} key={owner.id}>
                  <span className="owner-avatar" aria-hidden="true">
                    {owner.is_collective ? "⌂" : owner.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="owner-info">
                    <strong>{owner.name}</strong>
                    <small>
                      {owner.is_collective
                        ? "Coleção compartilhada"
                        : owner.is_active
                          ? "Ativo"
                          : "Desativado"}
                    </small>
                  </span>
                  <div className="owner-actions">
                    <form action={toggleOwner}>
                      <input name="ownerId" type="hidden" value={owner.id} />
                      <button className="text-button" type="submit">
                        {owner.is_active ? "Desativar" : "Reativar"}
                      </button>
                    </form>
                    {isAdmin && (
                      <OwnerDeleteForm ownerId={owner.id} ownerName={owner.name} />
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <AddOwnerForm />
          </div>
        </details>

        <div className="next-actions-grid">
          <Link className="next-step-card library-catalog-link" href="/biblioteca/livros">
            <span aria-hidden="true">▤</span>
            <div>
              <strong>Ver livros cadastrados</strong>
              <p>Consulte e busque por título, autor, ISBN, proprietário ou localização.</p>
            </div>
          </Link>
          <Link className="next-step-card" href="/biblioteca/livros/novo/foto">
            <span aria-hidden="true">▣</span>
            <div>
              <strong>Cadastrar por foto</strong>
              <p>Fotografe a capa e a ficha catalográfica para preencher os dados.</p>
            </div>
          </Link>
          <Link className="next-step-card" href="/biblioteca/livros/novo/scanner">
            <span aria-hidden="true">▥</span>
            <div>
              <strong>Escanear código de barras</strong>
              <p>Use a câmera do celular para identificar o ISBN.</p>
            </div>
          </Link>
          <Link className="next-step-card" href="/biblioteca/livros/novo/isbn">
            <span aria-hidden="true">⌁</span>
            <div>
              <strong>Cadastrar por ISBN</strong>
              <p>Busque os dados usando o número do código de barras.</p>
            </div>
          </Link>
          <Link className="next-step-card" href="/biblioteca/livros/novo">
            <span aria-hidden="true">＋</span>
            <div>
              <strong>Cadastrar manualmente</strong>
              <p>Preencha título, autor, proprietário e localização.</p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
