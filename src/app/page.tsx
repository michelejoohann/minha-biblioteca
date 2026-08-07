import Link from "next/link";

const recursos = [
  { icon: "⌁", label: "Cadastro rápido por ISBN" },
  { icon: "⌖", label: "Localização de cada exemplar" },
  { icon: "✓", label: "Leitura e empréstimos" },
  { icon: "♡", label: "Wishlist sem duplicidade" },
];

export default function Home() {
  return (
    <main className="home-page">
      <section className="hero" aria-labelledby="home-title">
        <div className="brand-mark" aria-hidden="true">MB</div>
        <span className="eyebrow">Biblioteca familiar</span>
        <h1 id="home-title">Seus livros, encontrados em segundos.</h1>
        <p className="hero-copy">
          Organize os livros de Michele, Ayra, Fabio, Denise e da Casa em um só lugar.
        </p>
        <ul className="feature-list">
          {recursos.map((recurso) => (
            <li key={recurso.label}>
              <span aria-hidden="true">{recurso.icon}</span>
              {recurso.label}
            </li>
          ))}
        </ul>
        <Link className="primary-button" href="/login">
          Entrar na biblioteca
        </Link>
        <p className="status">Projeto em construção · MVP</p>
      </section>
    </main>
  );
}
