"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  ManualBookForm,
  type BookDraft,
  type OwnerOption,
} from "../manual-book-form";
import {
  lookupIsbn,
  type IsbnLookupState,
} from "./lookup-actions";

const initialLookupState: IsbnLookupState = {
  message: "",
  status: "idle",
};

export function IsbnRegistration({
  initialIsbn,
  locations,
  owners,
}: {
  initialIsbn?: string;
  locations: string[];
  owners: OwnerOption[];
}) {
  const [state, action, pending] = useActionState(lookupIsbn, initialLookupState);
  const formRef = useRef<HTMLFormElement>(null);
  const submittedInitialIsbn = useRef(false);

  useEffect(() => {
    if (initialIsbn && !submittedInitialIsbn.current) {
      submittedInitialIsbn.current = true;
      formRef.current?.requestSubmit();
    }
  }, [initialIsbn]);

  if (state.status === "ready" && state.isbn) {
    const metadata = state.metadata;
    const autoFilledFields = metadata
      ? [
          metadata.title && "título",
          metadata.authors.length && "autor",
          metadata.subtitle && "subtítulo",
          metadata.publisher && "editora",
          metadata.publicationYear && "ano",
          metadata.languageCode && "idioma",
          metadata.genres.length && "gêneros",
          metadata.description && "descrição",
        ].filter((field): field is string => Boolean(field))
      : [];
    const initialDraft: Partial<BookDraft> = {
      author: metadata?.authors.join(", ") ?? "",
      description: metadata?.description ?? "",
      genres: metadata?.genres.join(", ") ?? "",
      isbn10: state.isbn.isbn10 ?? "",
      isbn13: state.isbn.isbn13,
      languageCode: metadata?.languageCode ?? "pt-BR",
      publicationYear: metadata?.publicationYear?.toString() ?? "",
      publisher: metadata?.publisher ?? "",
      subtitle: metadata?.subtitle ?? "",
      title: metadata?.title ?? "",
    };

    return (
      <div className="isbn-result-flow">
        <div className={`lookup-message ${state.found ? "found" : "not-found"}`} role="status">
          <span aria-hidden="true">{state.found ? "✓" : "i"}</span>
          <div>
            <strong>{state.found ? "Dados encontrados" : "Cadastro manual liberado"}</strong>
            <p>{state.message}</p>
            {autoFilledFields.length > 0 && (
              <p>
                Preenchido automaticamente: {autoFilledFields.join(", ")}.
              </p>
            )}
            {state.found && metadata?.source && (
              <p>Fontes consultadas: {metadata.source}.</p>
            )}
          </div>
          <button onClick={() => window.location.reload()} type="button">
            Consultar outro
          </button>
        </div>

        <ManualBookForm
          key={state.isbn.isbn13}
          initialDraft={initialDraft}
          locations={locations}
          owners={owners}
        />
      </div>
    );
  }

  return (
    <form className="isbn-lookup-card" action={action} ref={formRef}>
      <div className="isbn-symbol" aria-hidden="true">⌁</div>
      <span className="eyebrow">Busca por ISBN</span>
      <h2>Digite o número do livro</h2>
      <p>
        Normalmente ele fica acima do código de barras, na contracapa.
      </p>
      <div className="field">
        <label htmlFor="isbn">ISBN-10 ou ISBN-13</label>
        <input
          autoComplete="off"
          autoFocus={!initialIsbn}
          defaultValue={initialIsbn}
          id="isbn"
          inputMode="numeric"
          maxLength={24}
          name="isbn"
          placeholder="978-85-00000-00-0"
          required
        />
      </div>
      {state.message && (
        <p className="form-message error" role="alert">{state.message}</p>
      )}
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Buscando…" : "Buscar informações"}
      </button>
    </form>
  );
}

