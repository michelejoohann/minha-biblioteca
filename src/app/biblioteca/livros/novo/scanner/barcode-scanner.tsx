"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeEan13FromGrayscale } from "@/lib/books/ean13";
import { extractIsbnFromScan, parseIsbn } from "@/lib/books/isbn";

type DetectedBarcode = {
  format: string;
  rawValue: string;
};

type NativeBarcodeDetector = {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
};

type NativeBarcodeDetectorConstructor = {
  getSupportedFormats(): Promise<string[]>;
  new (options: { formats: string[] }): NativeBarcodeDetector;
};

type CameraCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
  zoom?: { max: number; min: number; step?: number };
};

type CameraConstraintSet = MediaTrackConstraintSet & {
  focusMode?: string;
  zoom?: number;
};

type CameraSettings = MediaTrackSettings & {
  zoom?: number;
};

type ZoomRange = {
  max: number;
  min: number;
  step: number;
  value: number;
};

async function createNativeDetector() {
  const Detector = (
    globalThis as typeof globalThis & {
      BarcodeDetector?: NativeBarcodeDetectorConstructor;
    }
  ).BarcodeDetector;

  if (!Detector) {
    return null;
  }

  try {
    const supported = await Detector.getSupportedFormats();
    const formats = ["ean_13", "qr_code"].filter((format) =>
      supported.includes(format),
    );
    return formats.length ? new Detector({ formats }) : null;
  } catch {
    return null;
  }
}

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
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const detectorRef = useRef<NativeBarcodeDetector | null>(null);
  const animationRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFrameRef = useRef(0);
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [message, setMessage] = useState("");
  const [manualIsbn, setManualIsbn] = useState("");
  const [manualError, setManualError] = useState("");
  const [zoomRange, setZoomRange] = useState<ZoomRange | null>(null);

  const stopCamera = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    trackRef.current = null;
    detectorRef.current = null;
    setZoomRange(null);
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
    async (time: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !streamRef.current) {
        return true;
      }

      if (time - lastFrameRef.current >= 150 && video.readyState >= 2) {
        lastFrameRef.current = time;
        const detector = detectorRef.current;

        if (detector) {
          try {
            const barcodes = await detector.detect(video);
            for (const barcode of barcodes) {
              const isbn = extractIsbnFromScan(barcode.rawValue);
              if (isbn) {
                goToIsbn(isbn.isbn13);
                return true;
              }
              if (barcode.format === "qr_code") {
                setMessage(
                  "O QR Code foi lido, mas ele não contém um ISBN válido. Procure o código de barras que começa com 978 ou 979.",
                );
              }
            }
          } catch {
            // Keep the local EAN-13 decoder active as a browser-compatible fallback.
          }
        }

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
          frameRate: { ideal: 30 },
          height: { ideal: 1080 },
          width: { ideal: 1920 },
        },
      });
      streamRef.current = stream;
      const [track] = stream.getVideoTracks();
      trackRef.current = track ?? null;

      if (!videoRef.current) {
        stopCamera();
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      detectorRef.current = await createNativeDetector();

      if (track) {
        const capabilities = track.getCapabilities() as CameraCapabilities;
        if (capabilities.focusMode?.includes("continuous")) {
          try {
            const focus: CameraConstraintSet = { focusMode: "continuous" };
            await track.applyConstraints({ advanced: [focus] });
          } catch {
            // Some devices advertise focus controls but reject changing them.
          }
        }

        if (capabilities.zoom && capabilities.zoom.max > capabilities.zoom.min) {
          const settings = track.getSettings() as CameraSettings;
          const preferredZoom = Math.min(
            capabilities.zoom.max,
            Math.max(capabilities.zoom.min, settings.zoom ?? 1.5),
          );
          const nextZoomRange = {
            max: capabilities.zoom.max,
            min: capabilities.zoom.min,
            step: capabilities.zoom.step || 0.1,
            value: preferredZoom,
          };
          setZoomRange(nextZoomRange);
          try {
            const zoom: CameraConstraintSet = { zoom: preferredZoom };
            await track.applyConstraints({ advanced: [zoom] });
          } catch {
            // The slider remains available for devices that require a user gesture.
          }
        }
      }

      setStatus("scanning");
      setMessage(
        "Centralize o código, mantenha cerca de um palmo de distância e ajuste a aproximação se necessário.",
      );
      async function scanFrame(time: number) {
        if (!(await readFrame(time))) {
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

  async function changeZoom(value: number) {
    const track = trackRef.current;
    if (!track || !zoomRange) {
      return;
    }

    setZoomRange((current) => current ? { ...current, value } : current);
    try {
      const zoom: CameraConstraintSet = { zoom: value };
      await track.applyConstraints({ advanced: [zoom] });
    } catch {
      setMessage("Este aparelho não permitiu alterar a aproximação da câmera.");
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
          <h2>Aponte para o ISBN ou QR Code</h2>
          <p>
            Use o código de barras da contracapa que começa com 978 ou 979. Um QR
            Code também funciona quando contém um ISBN. Nenhuma imagem é enviada ou
            armazenada.
          </p>

          {message && (
            <div className={`camera-message ${status}`} role="status">
              {message}
            </div>
          )}

          {active && zoomRange && (
            <label className="camera-zoom">
              <span>Aproximação</span>
              <input
                aria-label="Aproximação da câmera"
                max={zoomRange.max}
                min={zoomRange.min}
                onChange={(event) => void changeZoom(Number(event.target.value))}
                step={zoomRange.step}
                type="range"
                value={zoomRange.value}
              />
            </label>
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

