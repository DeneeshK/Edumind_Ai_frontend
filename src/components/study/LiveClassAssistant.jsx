import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, Mic, MonitorUp, Radio, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  finishLiveClassSession,
  startLiveClassSession,
  uploadLiveClassAudioChunk
} from "../../api/studyApi";
import Button from "../common/Button";
import Card from "../common/Card";
import NoteDisplay from "./NoteDisplay";

const inputClasses = "w-full rounded-lg border border-line bg-panel px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-mint";

function formatElapsed(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function mapCaptureError(error) {
  if (error?.name === "NotAllowedError" || error?.name === "AbortError") {
    return "Screen sharing was cancelled. Please click Start again.";
  }
  if (error?.message?.includes("Study Assistant API")) {
    return error.message;
  }
  return error?.message || "Live Class Assistant could not start.";
}

function CenteredCard({ children }) {
  return (
    <div className="mx-auto max-w-xl">
      <Card className="p-6">{children}</Card>
    </div>
  );
}

function InstructionSteps() {
  const steps = [
    "Open Google Meet in another tab",
    "Come back here and click Start",
    "In the popup, choose Chrome Tab",
    "Select your Google Meet tab",
    "Enable Share tab audio",
    "Click Share"
  ];

  return (
    <div className="rounded-xl border border-line bg-panel2 p-4">
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-3 text-sm text-slate-300">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint/10 text-xs font-semibold text-mint">
              {index + 1}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LiveClassAssistant() {
  const [status, setStatus] = useState("idle");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [processingText, setProcessingText] = useState("Transcribing audio...");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const sessionIdRef = useRef("");
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const uploadPromisesRef = useRef([]);
  const stopRequestedRef = useRef(false);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (status !== "recording") return undefined;
    const interval = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [status]);

  function reset() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    streamRef.current = null;
    sessionIdRef.current = "";
    uploadPromisesRef.current = [];
    stopRequestedRef.current = false;
    setStatus("idle");
    setElapsed(0);
    setChunkCount(0);
    setProcessingText("Transcribing audio...");
    setError("");
    setResult(null);
    setTranscriptOpen(false);
  }

  function openGoogleMeet() {
    window.open("https://meet.google.com/", "_blank", "noopener,noreferrer");
  }

  async function startAssistant(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!title.trim()) {
      setError("Add a class title before starting.");
      setStatus("error");
      return;
    }

    setStatus("requesting");

    try {
      const session = await startLiveClassSession({
        title: title.trim(),
        subject
      });
      sessionIdRef.current = session.session_id;

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const audioTracks = stream.getAudioTracks();
      if (!audioTracks.length) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("No audio captured. Select a Chrome Tab and enable 'Share tab audio'.");
      }

      const audioStream = new MediaStream(audioTracks);
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"]
        .find((type) => MediaRecorder.isTypeSupported(type)) || "";
      const recorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : {});

      recorder.ondataavailable = (dataEvent) => {
        if (dataEvent.data?.size > 0) {
          const upload = uploadLiveClassAudioChunk(session.session_id, dataEvent.data)
            .then((response) => {
              setChunkCount(response.chunk_count || 0);
              return response;
            });
          uploadPromisesRef.current.push(upload);
        }
      };

      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (recorder.state === "recording") {
          stopAssistant();
        }
      });

      streamRef.current = stream;
      recorderRef.current = recorder;
      uploadPromisesRef.current = [];
      stopRequestedRef.current = false;
      startedAtRef.current = Date.now();
      setElapsed(0);
      setChunkCount(0);
      setStatus("recording");
      recorder.start(5000);
    } catch (err) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      streamRef.current = null;
      setError(mapCaptureError(err));
      setStatus("error");
    }
  }

  async function stopAssistant() {
    if (stopRequestedRef.current) return;
    stopRequestedRef.current = true;
    setStatus("stopping");
    setProcessingText("Transcribing audio...");

    const processingTimer = window.setTimeout(() => {
      setProcessingText("Generating notes...");
    }, 1400);

    try {
      const recorder = recorderRef.current;

      if (recorder?.state === "recording") {
        await new Promise((resolve) => {
          recorder.onstop = resolve;
          recorder.stop();
        });
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());

      const uploads = await Promise.allSettled(uploadPromisesRef.current);
      const failedUpload = uploads.find((item) => item.status === "rejected");
      if (failedUpload) {
        throw failedUpload.reason;
      }

      const data = await finishLiveClassSession(sessionIdRef.current);
      if (data.status === "completed" && !data.error) {
        setResult(data);
        setStatus("done");
      } else {
        throw new Error(data.error || "Live class processing failed.");
      }
    } catch (err) {
      setError(mapCaptureError(err));
      setStatus("error");
    } finally {
      window.clearTimeout(processingTimer);
      recorderRef.current = null;
      streamRef.current = null;
    }
  }

  if (status === "requesting") {
    return (
      <CenteredCard>
        <div className="py-10 text-center">
          <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-mint/10 text-mint">
            <MonitorUp className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-50">Select your Google Meet tab</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Choose Chrome Tab in the browser popup, select your Google Meet, and enable Share tab audio.
          </p>
        </div>
      </CenteredCard>
    );
  }

  if (status === "recording") {
    return (
      <CenteredCard>
        <div className="space-y-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose/30 bg-rose/10 px-3 py-1 text-sm font-semibold text-rose">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose" />
            Recording
          </div>
          <div className="font-mono text-5xl font-semibold text-slate-50">{formatElapsed(elapsed)}</div>
          <div className="mx-auto flex max-w-sm items-end justify-center gap-1">
            {[36, 56, 44, 68, 50, 76, 42, 58, 46, 66, 38, 54].map((height, index) => (
              <span
                key={`${height}-${index}`}
                className="w-2 rounded-full bg-mint/40"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
          <p className="text-sm text-slate-500">Chunks uploaded: {chunkCount}</p>
          <Button type="button" className="px-6 py-3 text-base" onClick={stopAssistant}>
            Stop and Generate Notes
          </Button>
        </div>
      </CenteredCard>
    );
  }

  if (status === "stopping") {
    return (
      <CenteredCard>
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-mint" />
          <h2 className="mt-5 text-2xl font-semibold text-slate-50">{processingText}</h2>
          <p className="mt-2 text-sm text-slate-400">This can take a moment for longer classes.</p>
        </div>
      </CenteredCard>
    );
  }

  if (status === "done") {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-mint/25 bg-mint/10 p-4 text-sm font-semibold text-mint">
          <CheckCircle2 className="mr-2 inline h-4 w-4" />
          Notes ready - {title}
        </div>
        {result?.transcript && (
          <Card className="p-5">
            <button
              type="button"
              onClick={() => setTranscriptOpen((value) => !value)}
              className="flex w-full items-center justify-between gap-3 text-left font-semibold text-slate-100"
            >
              {transcriptOpen ? "Hide transcript" : "Show transcript"}
              <span className="text-sm text-slate-500">{transcriptOpen ? "▴" : "▾"}</span>
            </button>
            {transcriptOpen && (
              <p className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-panel2 p-4 text-sm leading-relaxed text-slate-400">
                {result.transcript}
              </p>
            )}
          </Card>
        )}
        <Card className="p-6">
          <NoteDisplay note={result?.note} />
        </Card>
        <Button type="button" variant="secondary" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Start New Session
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <CenteredCard>
        <div className="py-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose/10 text-rose">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-slate-50">Something went wrong</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{error}</p>
          <Button type="button" className="mt-6" onClick={reset}>
            Try Again
          </Button>
        </div>
      </CenteredCard>
    );
  }

  return (
    <CenteredCard>
      <form className="space-y-5" onSubmit={startAssistant}>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint/10 text-mint">
            <Radio className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-slate-50">Live Class Assistant</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Capture your Google Meet and get learnable notes automatically.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Chapter 5 - Newton's Laws"
            className={inputClasses}
          />
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="e.g. Physics"
            className={inputClasses}
          />
        </div>

        <InstructionSteps />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={openGoogleMeet}>
            Open Google Meet
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button type="submit">
            <Mic className="h-4 w-4" />
            Start Live Assistant
          </Button>
        </div>
      </form>
    </CenteredCard>
  );
}
