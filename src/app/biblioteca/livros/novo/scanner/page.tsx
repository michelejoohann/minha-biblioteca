import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BarcodeScanner } from "./barcode-scanner";

export default async function ScannerPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    redirect("/login");
  }

  return (
    <main className="book-entry-page scanner-page">
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
          <span className="eyebrow">Cadastro mais rápido</span>
          <h1>Escanear livro</h1>
          <p>
            Leia o ISBN pela câmera do celular e revise as informações antes de
            cadastrar o exemplar.
          </p>
        </div>
        <BarcodeScanner />
      </section>
    </main>
  );
}

