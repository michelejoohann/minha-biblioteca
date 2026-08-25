"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { LoggerMessage } from "tesseract.js";
import {
  extractPhotoTextDraft,
  type PhotoTextDraft,
} from "@/lib/books/photo-extraction";
import { createClient } from "@/lib/supabase/client";
import {
  ManualBookForm,
  type BookDraft,
  type OwnerOption,
} from "../manual-book-form";
import { lookupPhotoMetadata } from "./actions";

type Phase = "idle" | "reading" | "searching" | "uploading" | "ready" | "error";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionFor(file: Blob) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

async function resizePhoto(file: File, maxDimension = 1800) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Não foi possível preparar a imagem.");
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Não foi possível reduzir a imagem.")),
      "image/jpeg",
      0.86,
    );
  });
}

function PhotoPicker({
  file,
  id,
  label,
  onChange,
  preview,
  required,
  tip,
}: {
  file?: File;
  id: string;
  label: string;
  onChange: (file?: File) => void;
  preview?: string;
  required?: boolean;
  tip: string;
}) {
  return (
    <div className="photo-picker">
      <div className="photo-picker-copy">
        <span className="eyebrow">{required ? "Obrigatória" : "Recomendada"}</span>
        <h2>{label}</h2>
        <p>{tip}</p>
      </div>

      {preview ? (
        <div className="photo-preview">
          <Image alt={`Prévia: ${label}`} height={480} src={preview} unoptimized width={360} />
        </div>
      ) : (
        <div className="photo-placeholder" aria-hidden="true">
          <span>▣</span>
          <small>Nenhuma foto selecionada</small>
        </div>
      )}

      <label className="secondary-button photo-button" htmlFor={id}>
        {file ? "Tirar outra foto" : "Abrir câmera"}
      </label>
      <input
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="visually-hidden"
        id={id}
        onChange={(event) => onChange(event.target.files?.[0])}
        type="file"
      />
    </div>
  );
}

function mergeDraft(extracted: PhotoTextDraft, metadata?: Awaited<ReturnType<typeof lookupPhotoMetadata>>["metadata"]): Partial<BookDraft> {
  return {
    author: metadata?.authors.join(", ") || extracted.author,
    description: metadata?.description ?? "",
    editionLabel: extracted.editionLabel,
    genres: metadata?.genres.join(", ") ?? "",
    isbn10: extracted.isbn?.isbn10 ?? "",
    isbn13: extracted.isbn?.isbn13 ?? "",
    languageCode: metadata?.languageCode ?? "pt-BR",
    publicationYear: metadata?.publicationYear?.toString() || extracted.publicationYear,
    publisher: metadata?.publisher || extracted.publisher,
    subtitle: metadata?.subtitle ?? "",
    title: metadata?.title || extracted.title,
  };
}

export function PhotoRegistration({
  householdId,
  locations,
  owners,
  userId,
}: {
  householdId: string;
  locations: string[];
  owners: OwnerOption[];
  userId: string;
}) {
  const [coverFile, setCoverFile] = useState<File>();
  const [detailsFile, setDetailsFile] = useState<File>();
  const [draft, setDraft] = useState<Partial<BookDraft>>();
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);

  const coverPreview = useMemo(
    () => coverFile ? URL.createObjectURL(coverFile) : undefined,
    [coverFile],
  );
  const detailsPreview = useMemo(
    () => detailsFile ? URL.createObjectURL(detailsFile) : undefined,
    [detailsFile],
  );

  useEffect(() => () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    if (detailsPreview) URL.revokeObjectURL(detailsPreview);
  }, [coverPreview, detailsPreview]);

  function choosePhoto(setter: (file?: File) => void, file?: File) {
    setMessage("");
    setDraft(undefined);
    setPhase("idle");

    if (!file) {
      setter(undefined);
      return;
    }

    if (!acceptedTypes.has(file.type)) {
      setMessage("Use uma foto JPG, PNG ou WebP.");
      setPhase("error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("A foto deve ter no máximo 10 MB.");
      setPhase("error");
      return;
    }

    setter(file);
  }

  async function analyzePhotos() {
    if (!coverFile) {
      setMessage("Tire pelo menos a foto da capa para continuar.");
      setPhase("error");
      return;
    }

    setDraft(undefined);
    setMessage("Preparando as fotos…");
    setPhase("reading");
    setProgress(2);

    let worker: Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>> | undefined;

    try {
      const [coverImage, detailsImage] = await Promise.all([
        resizePhoto(coverFile),
        detailsFile ? resizePhoto(detailsFile) : Promise.resolve(undefined),
      ]);
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("por+eng", undefined, {
        logger: (update: LoggerMessage) => {
          if (typeof update.progress === "number") {
            setProgress(Math.max(4, Math.round(update.progress * (detailsImage ? 46 : 88))));
          }
        },
      });

      setMessage("Lendo a capa…");
      const coverResult = await worker.recognize(coverImage, { rotateAuto: true });
      let detailsText = "";

      if (detailsImage) {
        setMessage("Lendo a ficha catalográfica…");
        const detailsResult = await worker.recognize(detailsImage, { rotateAuto: true });
        detailsText = detailsResult.data.text;
      }

      const extracted = extractPhotoTextDraft(coverResult.data.text, detailsText);
      let metadataResult: Awaited<ReturnType<typeof lookupPhotoMetadata>> | undefined;

      if (extracted.isbn) {
        setPhase("searching");
        setProgress(92);
        setMessage("ISBN encontrado. Buscando os dados do livro…");
        metadataResult = await lookupPhotoMetadata(extracted.isbn.isbn13);
      }

      setPhase("uploading");
      setProgress(96);
      setMessage("Guardando a foto da capa com segurança…");
      const preparedCover = await resizePhoto(coverFile, 1600);
      const coverPath = `${householdId}/${userId}/${crypto.randomUUID()}.${extensionFor(preparedCover)}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("book-covers")
        .upload(coverPath, preparedCover, {
          cacheControl: "3600",
          contentType: preparedCover.type || "image/jpeg",
          upsert: false,
        });

      const nextDraft = mergeDraft(extracted, metadataResult?.metadata);
      setDraft({
        ...nextDraft,
        coverPath: uploadError ? "" : coverPath,
      });
      setProgress(100);
      setPhase("ready");
      setMessage(
        uploadError
          ? "Os dados foram reconhecidos, mas a capa não pôde ser guardada. Você ainda pode cadastrar o livro."
          : extracted.isbn
            ? metadataResult?.message ?? "Dados reconhecidos. Revise os campos antes de salvar."
            : "Não encontrei um ISBN válido. Preenchi o que foi possível; revise os campos abaixo.",
      );
    } catch {
      setMessage("Não foi possível ler essa foto. Tente novamente com boa luz e sem reflexos.");
      setPhase("error");
    } finally {
      await worker?.terminate();
    }
  }

  if (draft) {
    return (
      <div className="photo-result-flow">
        <div className="lookup-message found" role="status">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Fotos analisadas</strong>
            <p>{message}</p>
            <p>A foto interna foi usada somente para reconhecimento e não foi salva.</p>
          </div>
          <button onClick={() => setDraft(undefined)} type="button">Trocar fotos</button>
        </div>

        {coverPreview && (
          <div className="recognized-cover">
            <Image alt="Capa fotografada" height={320} src={coverPreview} unoptimized width={240} />
            <div>
              <span className="eyebrow">Capa selecionada</span>
              <strong>{draft.title || "Título a confirmar"}</strong>
              <small>{draft.author || "Autor a confirmar"}</small>
            </div>
          </div>
        )}

        <ManualBookForm initialDraft={draft} locations={locations} owners={owners} />
      </div>
    );
  }

  const busy = phase === "reading" || phase === "searching" || phase === "uploading";

  return (
    <div className="photo-registration-flow">
      <div className="photo-grid">
        <PhotoPicker
          file={coverFile}
          id="cover-photo"
          label="Foto da capa"
          onChange={(file) => choosePhoto(setCoverFile, file)}
          preview={coverPreview}
          required
          tip="Enquadre a capa inteira, sem cortar o título ou o nome do autor."
        />
        <PhotoPicker
          file={detailsFile}
          id="details-photo"
          label="Foto da ficha catalográfica"
          onChange={(file) => choosePhoto(setDetailsFile, file)}
          preview={detailsPreview}
          tip="Fotografe a página com ISBN, editora, edição e ano. Geralmente fica no início do livro."
        />
      </div>

      <div className="photo-privacy-note">
        <span aria-hidden="true">⌾</span>
        <p>
          A leitura acontece no seu aparelho. A página interna não é enviada ao
          Supabase nem guardada no sistema.
        </p>
      </div>

      {busy && (
        <div className="ocr-progress" role="status">
          <div>
            <strong>{message}</strong>
            <span>{progress}%</span>
          </div>
          <progress max="100" value={progress}>{progress}%</progress>
          <small>A primeira leitura pode levar alguns segundos no celular.</small>
        </div>
      )}

      {phase === "error" && message && (
        <p className="form-message error" role="alert">{message}</p>
      )}

      <div className="form-actions end-actions photo-analyze-actions">
        <button
          className="primary-button"
          disabled={busy || !coverFile}
          onClick={analyzePhotos}
          type="button"
        >
          {busy ? "Analisando fotos…" : "Analisar e preencher dados"}
        </button>
      </div>
    </div>
  );
}
