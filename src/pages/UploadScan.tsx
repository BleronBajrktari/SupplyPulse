import { CheckCircle2, ImagePlus, Loader2, Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PIPELINE_STEPS } from "../mocks/pipelineRun";
import { usePipelineRun } from "../hooks/usePipelineRun";

export default function UploadScan() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shopName, setShopName] = useState("Downtown Market");
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { phase, steps, run, reset } = usePipelineRun();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (phase === "complete") {
      const timer = setTimeout(() => navigate("/dashboard"), 700);
      return () => clearTimeout(timer);
    }
  }, [phase, navigate]);

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

  function handleRunScan() {
    if (!file) return;
    reset();
    run();
  }

  const isRunning = phase === "running" || phase === "complete";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-mono text-lg font-semibold text-zinc-100">Scan a Shelf Photo</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Upload one photo and Claude runs the full perceive → reason → act pipeline.
        </p>
      </div>

      {!isRunning && (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Shop Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
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
                  className="absolute -right-2 -top-2 rounded-full bg-zinc-800 p-1 text-zinc-300 hover:bg-zinc-700"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="mt-2 truncate text-xs text-zinc-500">{file.name}</p>
              </div>
            ) : (
              <>
                <ImagePlus className="h-10 w-10 text-zinc-600" />
                <p className="text-sm font-medium text-zinc-300">Drag & drop a shelf photo here</p>
                <p className="text-xs text-zinc-500">or click to browse · JPG or PNG</p>
              </>
            )}
          </div>

          <button
            type="button"
            disabled={!file}
            onClick={handleRunScan}
            className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
          >
            <Play className="h-4 w-4" />
            Run Scan
          </button>
        </>
      )}

      {isRunning && (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Running pipeline for {shopName}</h2>
            {phase === "complete" && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-status-ok">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Complete
              </span>
            )}
          </div>

          <ol className="flex flex-col gap-2">
            {PIPELINE_STEPS.map((step) => {
              const state = steps.find((s) => s.id === step.id);
              const status = state?.status ?? "pending";
              return (
                <li
                  key={step.id}
                  className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                    status === "active" ? "border-zinc-500 bg-surface-hover" : "border-border bg-bg"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    {status === "done" && <CheckCircle2 className="h-5 w-5 text-status-ok" />}
                    {status === "active" && <Loader2 className="h-5 w-5 animate-spin text-zinc-300" />}
                    {status === "pending" && <span className="h-2 w-2 rounded-full bg-zinc-700" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100">{step.label}</p>
                    <p className="truncate text-xs text-zinc-500">{step.toolLabel}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {phase === "complete" && (
            <p className="text-center text-xs text-zinc-500">Redirecting to the scan dashboard…</p>
          )}
        </div>
      )}
    </div>
  );
}
