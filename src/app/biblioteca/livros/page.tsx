import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
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

  const rawQuery = (await searchParams).q;
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery ?? "")
    .trim()
    .slice(0, 100);
  const { data: books, error } = await supabase.rpc("search_library_books", {
    p_household_id: membership.household_id,
    p_limit: 100,
    p_query: query,
  });
  const bookList = books ?? [];

  return (
    <main className="book-entry-page catalog-page">
      <header className="entry-header catalog-header">
        <Link className="back-link entry-back" href="/biblioteca">
          ← Voltar para a biblioteca
        </Link>
        <div className="library-brand">
          <span className="brand-mark" aria-hidden="true">MB</span>
          Minha Biblioteca
        </div>
      </header>

      <section className="catalog-content">
        <div className="entry-intro catalog-intro">
          <span className="eyebrow">Acervo da família</span>
          <h1>Livros cadastrados</h1>
          <p>Encontre um exemplar pelo título, autor, ISBN, proprietário ou localização.</p>
        </div>

        <form action="/biblioteca/livros" className="catalog-search" method="get">
          <div className="field">
            <label htmlFor="book-search">Buscar no acervo</label>
            <input
              defaultValue={query}
              id="book-search"
              maxLength={100}
              name="q"
              placeholder="Ex.: fantasia, autora, ISBN, Michele ou Sala"
              type="search"
            />
          </div>
          <button className="primary-button" type="submit">Buscar</button>
          {query && (
            <Link className="secondary-button" href="/biblioteca/livros">Limpar</Link>
          )}
        </form>

        {error ? (
          <div className="catalog-empty" role="alert">
            <h2>Não foi possível carregar os livros</h2>
            <p>Tente novamente em alguns instantes.</p>
          </div>
        ) : bookList.length === 0 ? (
          <div className="catalog-empty">
            <h2>{query ? "Nenhum livro encontrado" : "Seu acervo ainda está vazio"}</h2>
            <p>
              {query
                ? `Não encontramos resultados para “${query}”.`
                : "Cadastre o primeiro livro usando o leitor, o ISBN ou o formulário manual."}
            </p>
            {query ? (
              <Link className="secondary-button" href="/biblioteca/livros">Ver todos</Link>
            ) : (
              <Link className="primary-button" href="/biblioteca">Cadastrar livro</Link>
            )}
          </div>
        ) : (
          <>
            <div className="catalog-result-heading">
              <h2>{query ? `Resultados para “${query}”` : "Todos os livros"}</h2>
              <span>{bookList.length} {bookList.length === 1 ? "exemplar" : "exemplares"}</span>
            </div>
            <ul className="book-catalog-list">
              {bookList.map((book) => (
                <li className="book-catalog-card" key={book.copy_id}>
                  <div className="book-catalog-main">
                    <span className="book-spine" aria-hidden="true">▥</span>
                    <div>
                      <h3>{book.title}</h3>
                      {book.subtitle && <p className="book-subtitle">{book.subtitle}</p>}
                      <p className="book-authors">{book.authors || "Autor não informado"}</p>
                    </div>
                  </div>
                  <dl className="book-catalog-details">
                    <div><dt>Proprietário</dt><dd>{book.owner_name}</dd></div>
                    <div><dt>Localização</dt><dd>{book.location_name}</dd></div>
                    <div><dt>ISBN</dt><dd>{book.isbn_13 || book.isbn_10 || "Não informado"}</dd></div>
                    <div>
                      <dt>Edição</dt>
                      <dd>
                        {[book.publisher, book.publication_year].filter(Boolean).join(" · ") || "Não informada"}
                      </dd>
                    </div>
                  </dl>
                  {book.genres.length > 0 && (
                    <div className="book-genre-list">
                      {book.genres.slice(0, 5).map((genre) => <span key={genre}>{genre}</span>)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}

