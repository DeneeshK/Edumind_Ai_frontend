import { FileText, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { createPdfNotes } from "../../api/studyApi";
import Button from "../common/Button";
import Card from "../common/Card";
import DepthToggle from "./DepthToggle";
import NoteDisplay from "./NoteDisplay";

const inputClasses = "w-full rounded-lg border border-line bg-panel px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-mint";

function formatBytes(bytes = 0) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function EmptyResult() {
  return (
    <Card className="flex min-h-[420px] items-center justify-center p-8 text-center">
      <div>
        <FileText className="mx-auto h-10 w-10 text-mint" />
        <h3 className="mt-4 text-lg font-semibold text-slate-100">Your PDF notes will appear here</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Upload a PDF and generate a compact, learnable note.
        </p>
      </div>
    </Card>
  );
}

function LoadingResult() {
  return (
    <Card className="min-h-[420px] p-6">
      <div className="flex items-center gap-3 rounded-lg border border-line bg-panel2 p-4">
        <Loader2 className="h-5 w-5 animate-spin text-mint" />
        <div>
          <p className="font-semibold text-slate-100">Reading PDF and generating notes</p>
          <p className="mt-1 text-sm text-slate-400">Large PDFs may take a little longer.</p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-5 w-2/3 animate-pulse rounded bg-panel2" />
        <div className="h-24 animate-pulse rounded bg-panel2" />
        <div className="h-32 animate-pulse rounded bg-panel2" />
      </div>
    </Card>
  );
}

function ErrorResult({ error }) {
  return (
    <Card className="min-h-[260px] p-6">
      <div className="rounded-lg border border-rose/30 bg-rose/10 p-4 text-sm leading-relaxed text-rose">
        {error}
      </div>
    </Card>
  );
}

function Result({ result }) {
  const extraction = result?.extraction;

  return (
    <Card className="space-y-5 p-6">
      {result.error ? (
        <div className="rounded-lg border border-rose/30 bg-rose/10 p-4 text-sm leading-relaxed text-rose">
          {result.error}
        </div>
      ) : (
        <>
          {extraction && (
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-line bg-panel2 px-3 py-1">
                {extraction.total_pages ?? 0} pages
              </span>
              <span className="rounded-full border border-line bg-panel2 px-3 py-1">
                {(extraction.char_count ?? 0).toLocaleString()} chars
              </span>
              <span className="rounded-full border border-line bg-panel2 px-3 py-1">
                {extraction.successful_pages ?? 0} pages extracted
              </span>
              {Boolean(extraction.low_text_pages?.length) && (
                <span className="rounded-full border border-amber/25 bg-amber/10 px-3 py-1 text-amber">
                  Low text: {extraction.low_text_pages.join(", ")}
                </span>
              )}
            </div>
          )}
          <NoteDisplay note={result.note} />
        </>
      )}
    </Card>
  );
}

export default function PDFNotes() {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [depth, setDepth] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function selectFile(selected) {
    setError("");
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError("Please choose a PDF file.");
      return;
    }
    setFile(selected);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!file) {
      setError("Choose a PDF before generating notes.");
      return;
    }

    setLoading(true);
    try {
      const data = await createPdfNotes({ file, title, subject, depth });
      setResult(data);
    } catch (err) {
      setError(err.message || "PDF notes could not be generated.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
      <Card className="p-5">
        <form className="space-y-5" onSubmit={submit}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              selectFile(event.dataTransfer.files?.[0]);
            }}
            className={`flex w-full flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition ${
              dragging ? "border-mint bg-mint/10" : "border-line bg-panel2 hover:border-mint/40"
            }`}
          >
            <Upload className="h-8 w-8 text-mint" />
            {file ? (
              <span className="mt-4 w-full rounded-lg border border-line bg-panel p-3 text-left">
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-100">{file.name}</span>
                    <span className="mt-1 block text-xs text-slate-500">{formatBytes(file.size)}</span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="rounded-md p-1 text-slate-500 hover:bg-rose/10 hover:text-rose"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </span>
                </span>
              </span>
            ) : (
              <>
                <span className="mt-4 text-base font-semibold text-slate-100">Drop your PDF here</span>
                <span className="mt-1 text-sm text-slate-400">or click to browse</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => selectFile(event.target.files?.[0])}
          />

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Chapter 5 - Thermodynamics"
            className={inputClasses}
          />
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="e.g. Physics"
            className={inputClasses}
          />

          {error && (
            <div className="rounded-lg border border-rose/30 bg-rose/10 p-3 text-sm text-rose">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <DepthToggle value={depth} onChange={setDepth} disabled={loading} />
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate Notes
            </Button>
          </div>
        </form>
      </Card>

      {loading ? <LoadingResult /> : result ? <Result result={result} /> : error ? <ErrorResult error={error} /> : <EmptyResult />}
    </div>
  );
}
