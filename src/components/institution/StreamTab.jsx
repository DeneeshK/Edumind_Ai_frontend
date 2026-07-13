import {
  CalendarClock,
  ExternalLink,
  FileText,
  Megaphone,
  Send,
  Video
} from "lucide-react";
import { useEffect, useState } from "react";
import { createResourcePost, fetchPosts } from "../../api/institutionApi";
import { renderMarkdown } from "../../utils/markdown";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import LoadingSpinner from "../common/LoadingSpinner";

const COMPOSER_TYPES = [
  { key: "announcement", label: "Announcement", icon: Megaphone },
  { key: "note", label: "Note", icon: FileText },
  { key: "meet", label: "Live class", icon: Video }
];

const POST_META = {
  announcement: { icon: Megaphone, label: "Announcement" },
  note: { icon: FileText, label: "Note" },
  meet: { icon: Video, label: "Live class" },
  task: { icon: Send, label: "Task" },
  revision_plan: { icon: CalendarClock, label: "Revision plan" }
};

function initials(name) {
  return (name || "T")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatWhen(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  });
}

const EMPTY_DRAFT = { title: "", body: "", link: "", time: "" };

function Composer({ classroomId, onPosted }) {
  const [type, setType] = useState("announcement");
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  function set(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  const canPost =
    type === "meet" ? draft.link.trim() : draft.body.trim() || draft.title.trim();

  async function handlePost(event) {
    event.preventDefault();
    if (!canPost) return;
    setPosting(true);
    setError("");
    try {
      await createResourcePost(classroomId, {
        postType: type,
        title: draft.title,
        bodyMarkdown: draft.body,
        linkUrl: draft.link,
        eventTime: draft.time
      });
      setDraft(EMPTY_DRAFT);
      onPosted();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  return (
    <form onSubmit={handlePost} className="rounded-lg border border-line bg-panel p-4">
      <div className="flex gap-1 rounded-lg border border-line bg-panel2 p-1">
        {COMPOSER_TYPES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setType(key); setError(""); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              type === key
                ? "bg-white text-slate-100 shadow-sm ring-1 ring-line"
                : "text-slate-400 hover:text-slate-100"
            }`}
          >
            <Icon className={`h-4 w-4 ${type === key ? "text-mint" : "text-slate-400"}`} />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2.5">
        {(type === "note" || type === "meet") && (
          <input
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder={type === "meet" ? "Live class title (e.g. Doubt-clearing session)" : "Note title"}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
          />
        )}

        {type === "meet" ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            <input
              value={draft.link}
              onChange={(e) => set("link", e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
            />
            <input
              type="datetime-local"
              value={draft.time}
              onChange={(e) => set("time", e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
            />
          </div>
        ) : (
          <textarea
            value={draft.body}
            onChange={(e) => set("body", e.target.value)}
            rows={type === "note" ? 4 : 3}
            placeholder={
              type === "note"
                ? "Write notes or study material to share… (markdown supported)"
                : "Share an update or instructions with your class…"
            }
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
          />
        )}
      </div>

      {error && <p className="mt-2 text-sm text-rose">{error}</p>}

      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {type === "meet" ? "Students get a Join button" : "Markdown supported"}
        </span>
        <Button type="submit" disabled={posting || !canPost}>
          <Send className="h-4 w-4" />
          {posting ? "Sharing…" : "Share with class"}
        </Button>
      </div>
    </form>
  );
}

function MeetCard({ post, meta }) {
  const when = formatWhen(post.meta_json?.event_time);
  const link = post.meta_json?.link_url;
  return (
    <div className="mt-3 rounded-lg border border-mint/30 bg-mint/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint/15 text-mint">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">{post.title || "Live class"}</p>
            {when && (
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <CalendarClock className="h-3 w-3" />
                {when}
              </p>
            )}
          </div>
        </div>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer">
            <Button className="!px-3 !py-1.5">
              <ExternalLink className="h-4 w-4" />
              Join Google Meet
            </Button>
          </a>
        )}
      </div>
      {post.body_markdown && (
        <p className="mt-2.5 text-sm text-slate-400">{post.body_markdown}</p>
      )}
    </div>
  );
}

export default function StreamTab({ classroomId, isTeacher }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const data = await fetchPosts(classroomId);
      setPosts(data.posts || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {isTeacher && <Composer classroomId={classroomId} onPosted={load} />}

      {loading && <LoadingSpinner label="Loading stream" />}
      {error && <p className="text-sm text-rose">{error}</p>}
      {!loading && posts.length === 0 && (
        <EmptyState
          title="Nothing shared yet"
          description={isTeacher
            ? "Post an announcement, share notes, or drop a Google Meet link for your class."
            : "Your tutor hasn't shared anything yet."}
        />
      )}

      <div className="space-y-3">
        {posts.map((post) => {
          const meta = POST_META[post.post_type] || POST_META.announcement;
          const Icon = meta.icon;
          const targeted = !post.audience_json?.all;
          return (
            <article key={post.id} className="rounded-lg border border-line bg-panel p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint/10 text-xs font-semibold text-mint">
                  {initials(post.author_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-100">{post.author_name}</p>
                  <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <Icon className="h-3 w-3" />
                    {meta.label}
                    <span aria-hidden>·</span>
                    {new Date(post.created_at).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                    })}
                    {targeted && isTeacher && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="text-slate-400">
                          {(post.audience_json?.student_ids || []).length} students
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {post.post_type === "meet" ? (
                <MeetCard post={post} meta={meta} />
              ) : (
                <>
                  {post.title && (
                    <h3 className="mt-3 text-base font-semibold text-slate-100">{post.title}</h3>
                  )}
                  {post.body_markdown && (
                    <div
                      className="prose prose-sm mt-1.5 max-w-none text-slate-300 [&_h1]:text-base [&_h2]:text-sm [&_li]:my-0.5 [&_p]:my-1.5"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body_markdown) }}
                    />
                  )}
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
