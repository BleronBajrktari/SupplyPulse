import { AlertTriangle, CheckCircle2, ImagePlus, Loader2, Play, X, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PIPELINE_STEPS } from "../mocks/pipelineRun";
import { scanWithProgress, type ScanResult, type StepEvent } from "../lib/api";

type StepUiStatus = "pending" | "running" | "done" | "error";

interface StepState {
  status: StepUiStatus;
  detail?: string;
}

function initialSteps(): StepState[] {
  return PIPELINE_STEPS.map(() => ({ status: "pending" as const }));
}

export default function UploadScan() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shopName, setShopName] = useState("Downtown Market");
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [phase, setPhase] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [steps, setSteps] = useState<StepState[]>(initialSteps);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function acceptFile(candidate: File | undefined) {
    if (!candidate) return;
    if (!["image/jpeg", "image/png"].includes(candidate.type)) return;
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
  }

  function clearFile() {
    setFile(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRunScan() {
    if (!file) return;
    setPhase("running");
    setScanError(null);
    setSteps(initialSteps());

    await scanWithProgress(file, shopName, {
      onStep: (step: StepEvent) => {
        setSteps((prev) => {
          const next = [...prev];
          const index = step.step - 1;
          if (index >= 0 && index < next.length) {
            next[index] = { status: step.status === "running" ? "running" : step.status, detail: step.detail };
          }
          return next;
        });
      },
        onResult: (result: ScanResult) => {
        localStorage.setItem("lastScanResult", JSON.stringify(result));
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            localStorage.setItem("lastScanImage", reader.result as string);
            setTimeout(() => navigate("/dashboard", { state: { result } }), 700);
          };
          reader.readAsDataURL(file);
        } else {
          setTimeout(() => navigate("/dashboard", { state: { result } }), 700);
        }
      },
      onError: (msg: string) => {
        setPhase("error");
        setScanError(msg);
      },
    });
  }

  function retryAfterError() {
    setPhase("idle");
    setScanError(null);
    setSteps(initialSteps());
  }

  const isRunning = phase === "running" || phase === "complete";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-mono text-lg font-semibold text-fg">Scan a Shelf Photo</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Upload one photo and Claude runs the full perceive → reason → act pipeline.
        </p>
      </div>

      {phase === "error" && (
        <div className="flex items-start gap-3 rounded-lg border border-status-critical/30 bg-status-critical/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-status-critical" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-fg">The scan couldn't be completed</p>
            <p className="mt-0.5 text-sm text-fg-muted">{scanError}</p>
          </div>
          <button
            onClick={retryAfterError}
            className="shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-hover"
          >
            Try again
          </button>
        </div>
      )}

      {!isRunning && (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Shop Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              acceptFile(e.dataTransfer.files[0]);
            }}
            onClick={() => !file && inputRef.current?.click()}
            className={`flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              isDragOver ? "border-zinc-400 bg-surface-hover" : "border-border bg-surface"
            } ${file ? "" : "cursor-pointer"}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />

            {file && previewUrl ? (
              <div className="relative w-full max-w-sm">
                <img src={previewUrl} alt="Shelf preview" className="mx-auto max-h-56 rounded-md object-contain" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="absolute -right-2 -top-2 rounded-full bg-zinc-800 p-1 text-fg hover:bg-zinc-700"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="mt-2 truncate text-xs text-fg-muted">{file.name}</p>
              </div>
            ) : (
              <>
                <ImagePlus className="h-10 w-10 text-fg-muted" />
                <p className="text-sm font-medium text-fg">Drag & drop a shelf photo here</p>
                <p className="text-xs text-fg-muted">or click to browse · JPG or PNG</p>
              </>
            )}
          </div>

          <button
            type="button"
            disabled={!file}
            onClick={handleRunScan}
            className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-fg-muted"
          >
            <Play className="h-4 w-4" />
            Run Scan
          </button>
        </>
      )}

      {isRunning && (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">Running pipeline for {shopName}</h2>
            {phase === "complete" && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-status-ok">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Complete
              </span>
            )}
          </div>

          <ol className="flex flex-col gap-2">
            {PIPELINE_STEPS.map((step, i) => {
              const state = steps[i] ?? { status: "pending" as const };
              return (
                <li
                  key={step.id}
                  className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                    state.status === "running" ? "border-zinc-500 bg-surface-hover" : "border-border bg-bg"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    {state.status === "done" && <CheckCircle2 className="h-5 w-5 text-status-ok" />}
                    {state.status === "running" && <Loader2 className="h-5 w-5 animate-spin text-fg" />}
                    {state.status === "error" && <XCircle className="h-5 w-5 text-status-critical" />}
                    {state.status === "pending" && <span className="h-2 w-2 rounded-full bg-zinc-700" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">{step.label}</p>
                    <p className="truncate text-xs text-fg-muted">{state.detail || step.toolLabel}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {phase === "complete" && (
            <p className="text-center text-xs text-fg-muted">Redirecting to the scan dashboard…</p>
          )}
        </div>
      )}
    </div>
  );
}
