"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createManualBook,
  type ManualBookActionState,
} from "./actions";

export type OwnerOption = {
  id: string;
  isCollective: boolean;
  name: string;
};

export type BookDraft = {
  author: string;
  description: string;
  editionLabel: string;
  genres: string;
  languageCode: string;
  locationName: string;
  notes: string;
  ownerId: string;
  publicationYear: string;
  publisher: string;
  isbn10: string;
  isbn13: string;
  subtitle: string;
  title: string;
};

const initialActionState: ManualBookActionState = {
  message: "",
  status: "idle",
};

const emptyDraft: BookDraft = {
  author: "",
  description: "",
  editionLabel: "",
  genres: "",
  languageCode: "pt-BR",
  locationName: "",
  notes: "",
  ownerId: "",
  publicationYear: "",
  publisher: "",
  isbn10: "",
  isbn13: "",
  subtitle: "",
  title: "",
};

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="review-item">
      <dt>{label}</dt>
      <dd>{value || "Não informado"}</dd>
    </div>
  );
}

export function ManualBookForm({
  initialDraft,
  locations,
  owners,
}: {
  initialDraft?: Partial<BookDraft>;
  locations: string[];
  owners: OwnerOption[];
}) {
  const [draft, setDraft] = useState<BookDraft>({
    ...emptyDraft,
    ...initialDraft,
    ownerId: initialDraft?.ownerId ?? owners[0]?.id ?? "",
  });
  const [reviewing, setReviewing] = useState(false);
  const [state, action, pending] = useActionState(createManualBook, initialActionState);
  const selectedOwner = owners.find((owner) => owner.id === draft.ownerId);

  function updateField(field: keyof BookDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  if (state.status === "success") {
    return (
      <div className="book-success" role="status">
        <span className="success-icon" aria-hidden="true">✓</span>
        <span className="eyebrow">Livro cadastrado</span>
        <h2>Tudo certo!</h2>
        <p>{state.message}</p>
        <Link className="primary-button" href="/biblioteca">
          Cadastrar outro livro
        </Link>
      </div>
    );
  }

  if (reviewing) {
    return (
      <form className="book-form" action={action}>
        {Object.entries(draft).map(([name, value]) => (
          <input key={name} name={name} type="hidden" value={value} />
        ))}

        <div className="review-heading">
          <span className="step-number">2 de 2</span>
          <div>
            <span className="eyebrow">Revisão</span>
            <h2>Confira antes de salvar</h2>
          </div>
        </div>

        <dl className="review-grid">
          <ReviewItem label="ISBN" value={draft.isbn13 || draft.isbn10} />
          <ReviewItem label="Título" value={draft.title} />
          <ReviewItem label="Autor" value={draft.author} />
          <ReviewItem label="Subtítulo" value={draft.subtitle} />
          <ReviewItem label="Proprietário" value={selectedOwner?.name ?? ""} />
          <ReviewItem label="Localização" value={draft.locationName} />
          <ReviewItem label="Editora" value={draft.publisher} />
          <ReviewItem label="Edição" value={draft.editionLabel} />
          <ReviewItem label="Ano" value={draft.publicationYear} />
          <ReviewItem label="Idioma" value={draft.languageCode} />
          <ReviewItem label="Gêneros" value={draft.genres} />
          <ReviewItem label="Descrição" value={draft.description} />
          <ReviewItem label="Observações" value={draft.notes} />
        </dl>

        {state.message && (
          <p className="form-message error" role="alert">{state.message}</p>
        )}

        <div className="form-actions">
          <button
            className="secondary-button"
            disabled={pending}
            onClick={() => setReviewing(false)}
            type="button"
          >
            Corrigir informações
          </button>
          <button className="primary-button" disabled={pending} type="submit">
            {pending ? "Salvando…" : "Confirmar e salvar"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      className="book-form"
      onSubmit={(event) => {
        event.preventDefault();
        setReviewing(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      <div className="form-section-heading">
        <span className="step-number">1 de 2</span>
        <div>
          <span className="eyebrow">Informações principais</span>
          <h2>Conte sobre o livro</h2>
        </div>
      </div>

      <div className="book-fields two-columns">
        {(draft.isbn13 || draft.isbn10) && (
          <div className="isbn-banner full-field">
            <span>ISBN identificado</span>
            <strong>{draft.isbn13 || draft.isbn10}</strong>
          </div>
        )}

        <div className="field full-field">
          <label htmlFor="title">Título *</label>
          <input
            autoFocus
            id="title"
            maxLength={300}
            onChange={(event) => updateField("title", event.target.value)}
            required
            value={draft.title}
          />
        </div>

        <div className="field full-field">
          <label htmlFor="subtitle">Subtítulo</label>
          <input
            id="subtitle"
            maxLength={300}
            onChange={(event) => updateField("subtitle", event.target.value)}
            value={draft.subtitle}
          />
        </div>

        <div className="field full-field">
          <label htmlFor="author">Autor *</label>
          <input
            id="author"
            maxLength={200}
            onChange={(event) => updateField("author", event.target.value)}
            required
            value={draft.author}
          />
        </div>

        <div className="field">
          <label htmlFor="ownerId">Proprietário *</label>
          <select
            id="ownerId"
            onChange={(event) => updateField("ownerId", event.target.value)}
            required
            value={draft.ownerId}
          >
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}{owner.isCollective ? " — compartilhado" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="locationName">Onde fica guardado? *</label>
          <input
            id="locationName"
            list="saved-locations"
            maxLength={120}
            onChange={(event) => updateField("locationName", event.target.value)}
            placeholder="Ex.: Sala — Estante 1"
            required
            value={draft.locationName}
          />
          <datalist id="saved-locations">
            {locations.map((location) => <option key={location} value={location} />)}
          </datalist>
        </div>
      </div>

      <div className="form-divider" />

      <div className="form-section-heading compact-heading">
        <div>
          <span className="eyebrow">Detalhes opcionais</span>
          <h2>Edição e organização</h2>
        </div>
      </div>

      <div className="book-fields two-columns">
        <div className="field">
          <label htmlFor="publisher">Editora</label>
          <input
            id="publisher"
            maxLength={200}
            onChange={(event) => updateField("publisher", event.target.value)}
            value={draft.publisher}
          />
        </div>

        <div className="field">
          <label htmlFor="editionLabel">Edição</label>
          <input
            id="editionLabel"
            maxLength={100}
            onChange={(event) => updateField("editionLabel", event.target.value)}
            placeholder="Ex.: 2ª edição"
            value={draft.editionLabel}
          />
        </div>

        <div className="field">
          <label htmlFor="publicationYear">Ano de publicação</label>
          <input
            id="publicationYear"
            inputMode="numeric"
            max={2200}
            min={1400}
            onChange={(event) => updateField("publicationYear", event.target.value)}
            type="number"
            value={draft.publicationYear}
          />
        </div>

        <div className="field">
          <label htmlFor="languageCode">Idioma</label>
          <select
            id="languageCode"
            onChange={(event) => updateField("languageCode", event.target.value)}
            value={draft.languageCode}
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="pt">Português</option>
            <option value="en">Inglês</option>
            <option value="es">Espanhol</option>
            <option value="fr">Francês</option>
          </select>
        </div>

        <div className="field full-field">
          <label htmlFor="genres">Gêneros</label>
          <input
            id="genres"
            maxLength={300}
            onChange={(event) => updateField("genres", event.target.value)}
            placeholder="Fantasia, aventura, romance"
            value={draft.genres}
          />
          <p className="field-hint">Separe os gêneros com vírgulas.</p>
        </div>

        <div className="field full-field">
          <label htmlFor="description">Descrição</label>
          <textarea
            id="description"
            maxLength={4000}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Resumo ou descrição do livro"
            rows={5}
            value={draft.description}
          />
        </div>

        <div className="field full-field">
          <label htmlFor="notes">Observações</label>
          <textarea
            id="notes"
            maxLength={1000}
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder="Condição do exemplar, dedicatória ou outra informação útil"
            rows={4}
            value={draft.notes}
          />
        </div>
      </div>

      <div className="form-actions end-actions">
        <button className="primary-button" type="submit">Revisar cadastro</button>
      </div>
    </form>
  );
}

