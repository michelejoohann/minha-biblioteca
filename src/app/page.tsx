const recursos = [
  "Cadastro rápido por ISBN",
  "Localização de cada exemplar",
  "Leitura e empréstimos",
  "Wishlist sem duplicidade",
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <span className="eyebrow">Biblioteca familiar</span>
        <h1>Seus livros, encontrados em segundos.</h1>
        <p>
          Organize os livros de Michele, Ayra, Fabio, Denise e da Casa em um só lugar.
        </p>
        <ul>
          {recursos.map((recurso) => (
            <li key={recurso}>{recurso}</li>
          ))}
        </ul>
        <p className="status">Projeto em construção · MVP</p>
      </section>
    </main>
  );
}

