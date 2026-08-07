import Link from "next/link";
import { AuthForm } from "./auth-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="auth-title">
        <div className="auth-intro">
          <div className="brand-mark" aria-hidden="true">MB</div>
          <div>
            <span className="eyebrow">Minha Biblioteca</span>
            <h1 id="auth-title">A casa dos seus livros.</h1>
            <p>
              Encontre, organize e compartilhe a biblioteca da família com tranquilidade.
            </p>
          </div>
        </div>

        <div className="auth-card">
          <h2>Boas-vindas</h2>
          <p className="auth-subtitle">Entre ou crie sua conta para começar.</p>
          <AuthForm />
          <Link className="back-link" href="/">
            ← Voltar para o início
          </Link>
        </div>
      </section>
    </main>
  );
}
