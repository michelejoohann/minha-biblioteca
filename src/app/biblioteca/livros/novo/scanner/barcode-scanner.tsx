"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeEan13FromGrayscale } from "@/lib/books/ean13";
import { parseIsbn } from "@/lib/books/isbn";

type ScannerStatus =
  | "denied"
  | "error"
  | "found"
  | "idle"
  | "scanning"
  | "starting"
  | "unavailable";

const statusCopy: Partial<Record<ScannerStatus, string>> = {
  denied:
    "A câmera foi bloqueada. Abra as configurações deste site no navegador, permita o uso da câmera e tente novamente.",
  error:
    "Não foi possível iniciar a câmera. Feche outros aplicativos que possam estar usando-a e tente novamente.",
  unavailable:
    "Este navegador não disponibilizou uma câmera. Você ainda pode digitar o ISBN abaixo.",
};

export function BarcodeScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFrameRef = useRef(0);
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [message, setMessage] = useState("");
  const [manualIsbn, setManualIsbn] = useState("");
  const [manualError, setManualError] = useState("");

  const stopCamera = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const goToIsbn = useCallback(
    (isbn: string) => {
      stopCamera();
      setStatus("found");
      setMessage(`ISBN ${isbn} reconhecido. Buscando os dados do livro…`);
      navigator.vibrate?.(80);
      timeoutRef.current = setTimeout(() => {
        router.push(`/biblioteca/livros/novo/isbn?isbn=${encodeURIComponent(isbn)}`);
      }, 450);
    },
    [router, stopCamera],
  );

  const readFrame = useCallback(
    (time: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !streamRef.current) {
        return true;
      }

      if (time - lastFrameRef.current >= 120 && video.readyState >= 2) {
        lastFrameRef.current = time;
        const width = Math.min(960, video.videoWidth);
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (context && width > 0 && video.videoHeight > 0) {
          canvas.width = width;
          canvas.height = 9;
          context.drawImage(
            video,
            0,
            video.videoHeight * 0.36,
            video.videoWidth,
            video.videoHeight * 0.28,
            0,
            0,
            width,
            canvas.height,
          );

          const image = context.getImageData(0, 0, width, canvas.height).data;
          for (let row = 0; row < canvas.height; row += 1) {
            const grayscale = new Uint8ClampedArray(width);
            for (let column = 0; column < width; column += 1) {
              const offset = (row * width + column) * 4;
              grayscale[column] = Math.round(
                image[offset] * 0.299 +
                  image[offset + 1] * 0.587 +
                  image[offset + 2] * 0.114,
              );
            }

            const code = decodeEan13FromGrayscale(grayscale);
            if (code) {
              if (code.startsWith("978") || code.startsWith("979")) {
                goToIsbn(code);
                return true;
              }
              setMessage(
                "O código foi lido, mas não é um ISBN de livro. Posicione o código que começa com 978 ou 979.",
              );
            }
          }
        }
      }

      return false;
    },
    [goToIsbn],
  );

  async function startCamera() {
    setMessage("");
    setStatus("starting");

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      setMessage(
        window.isSecureContext
          ? statusCopy.unavailable ?? ""
          : "A câmera só funciona no endereço seguro do aplicativo (HTTPS). Digite o ISBN abaixo por enquanto.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          height: { ideal: 720 },
          width: { ideal: 1280 },
        },
      });
      streamRef.current = stream;

      if (!videoRef.current) {
        stopCamera();
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStatus("scanning");
      setMessage("Centralize o código de barras dentro da faixa e mantenha o celular firme.");
      function scanFrame(time: number) {
        if (!readFrame(time)) {
          animationRef.current = requestAnimationFrame(scanFrame);
        }
      }
      animationRef.current = requestAnimationFrame(scanFrame);
    } catch (error) {
      stopCamera();
      const errorName = error instanceof DOMException ? error.name : "";
      const nextStatus: ScannerStatus =
        errorName === "NotAllowedError" || errorName === "SecurityError"
          ? "denied"
          : errorName === "NotFoundError" || errorName === "OverconstrainedError"
            ? "unavailable"
            : "error";
      setStatus(nextStatus);
      setMessage(statusCopy[nextStatus] ?? statusCopy.error ?? "");
    }
  }

  function submitManual(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isbn = parseIsbn(manualIsbn);
    if (!isbn) {
      setManualError("Digite um ISBN-10 ou ISBN-13 válido.");
      return;
    }

    setManualError("");
    router.push(
      `/biblioteca/livros/novo/isbn?isbn=${encodeURIComponent(isbn.isbn13)}`,
    );
  }

  useEffect(() => {
    return () => {
      stopCamera();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [stopCamera]);

  const active = status === "scanning" || status === "starting";

  return (
    <div className="scanner-flow">
      <section className={`scanner-card ${active ? "camera-active" : ""}`}>
        <div className="camera-preview">
          <video aria-label="Imagem da câmera" muted playsInline ref={videoRef} />
          {active && (
            <div className="scan-guide" aria-hidden="true">
              <span />
            </div>
          )}
          {!active && (
            <div className="camera-placeholder" aria-hidden="true">
              <span>▥</span>
              <p>A câmera permanece desligada até você iniciar.</p>
            </div>
          )}
        </div>
        <canvas className="scanner-canvas" ref={canvasRef} />

        <div className="scanner-copy">
          <span className="eyebrow">Leitura pela câmera</span>
          <h2>Aponte para o código de barras</h2>
          <p>
            Use o código da contracapa que começa com 978 ou 979. Nenhuma imagem é
            enviada ou armazenada.
          </p>

          {message && (
            <div className={`camera-message ${status}`} role="status">
              {message}
            </div>
          )}

          <div className="scanner-actions">
            {!active && status !== "found" && (
              <button className="primary-button" onClick={startCamera} type="button">
                {status === "idle" ? "Usar a câmera" : "Tentar novamente"}
              </button>
            )}
            {active && (
              <button
                className="secondary-button"
                onClick={() => {
                  stopCamera();
                  setStatus("idle");
                  setMessage("");
                }}
                type="button"
              >
                Parar câmera
              </button>
            )}
          </div>
        </div>
      </section>

      <form className="manual-isbn-card" onSubmit={submitManual}>
        <div>
          <span className="eyebrow">Alternativa</span>
          <h2>Prefere digitar?</h2>
          <p>O ISBN também fica impresso acima do código de barras.</p>
        </div>
        <div className="manual-isbn-controls">
          <div className="field">
            <label htmlFor="manual-isbn">ISBN-10 ou ISBN-13</label>
            <input
              autoComplete="off"
              id="manual-isbn"
              inputMode="numeric"
              maxLength={24}
              onChange={(event) => setManualIsbn(event.target.value)}
              placeholder="978-85-00000-00-0"
              value={manualIsbn}
            />
          </div>
          <button className="secondary-button" type="submit">Continuar</button>
        </div>
        {manualError && <p className="form-message error" role="alert">{manualError}</p>}
      </form>
    </div>
  );
}

