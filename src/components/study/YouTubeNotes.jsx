import { ChevronDown, ChevronUp, Loader2, Youtube } from "lucide-react";
import { useState } from "react";
import { createYoutubeNotes } from "../../api/studyApi";
import Button from "../common/Button";
import Card from "../common/Card";
import DepthToggle from "./DepthToggle";
import NoteDisplay from "./NoteDisplay";

const inputClasses = "w-full rounded-lg border border-line bg-panel px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-mint";

function normalizeYoutubeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isValidYoutubeUrl(value) {
  if (!value.trim()) return false;
  try {
    const url = new URL(normalizeYoutubeUrl(value));
    return ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"].includes(url.hostname);
  } catch {
    return false;
  }
}

function EmptyResult() {
  return (
    <Card className="flex min-h-[420px] items-center justify-center p-8 text-center">
      <div>
        <Youtube className="mx-auto h-10 w-10 text-rose" />
        <h3 className="mt-4 text-lg font-semibold text-slate-100">Paste a YouTube lesson</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Videos with captions or subtitles work best.
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
          <p className="font-semibold text-slate-100">Fetching transcript and generating notes</p>
          <p className="mt-1 text-sm text-slate-400">This depends on YouTube subtitle availability.</p>
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

function Result({ result }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (result.error) {
    return (
      <Card className="min-h-[260px] p-6">
        <div className="rounded-lg border border-rose/30 bg-rose/10 p-4 text-sm leading-relaxed text-rose">
          {result.error} Try a YouTube video with subtitles.
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5 p-6">
      {result.transcript_preview && (
        <div className="rounded-lg border border-line bg-panel2 p-3">
          <button
            type="button"
            onClick={() => setPreviewOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-slate-100"
          >
            Transcript preview
            {previewOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>
          {previewOpen && (
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{result.transcript_preview}</p>
          )}
        </div>
      )}
      <NoteDisplay note={result.note} />
    </Card>
  );
}

export default function YouTubeNotes() {
  const [url, setUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [depth, setDepth] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [urlError, setUrlError] = useState("");
  const [result, setResult] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setUrlError("");
    setResult(null);

    if (!isValidYoutubeUrl(url)) {
      setUrlError("Enter a valid YouTube URL.");
      return;
    }

    setLoading(true);
    try {
      const data = await createYoutubeNotes({ url: normalizeYoutubeUrl(url), subject, depth });
      setResult(data);
    } catch (err) {
      setError(err.message || "YouTube notes could not be generated.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
      <Card className="p-5">
        <form className="space-y-5" onSubmit={submit}>
          <label className="block">
            <span className="sr-only">YouTube URL</span>
            <div className="relative">
              <Youtube className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose" />
              <input
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setUrlError("");
                }}
                placeholder="youtube.com/watch?v=..."
                className={`${inputClasses} pl-10`}
              />
            </div>
            {urlError && <p className="mt-2 text-sm text-rose">{urlError}</p>}
          </label>

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

      {loading ? <LoadingResult /> : result ? <Result result={result} /> : error ? (
        <Card className="min-h-[260px] p-6">
          <div className="rounded-lg border border-rose/30 bg-rose/10 p-4 text-sm leading-relaxed text-rose">{error}</div>
        </Card>
      ) : <EmptyResult />}
    </div>
  );
}
