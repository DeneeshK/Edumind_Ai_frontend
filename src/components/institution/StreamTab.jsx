import { CalendarClock, Megaphone, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { createPost, fetchPosts } from "../../api/institutionApi";
import { renderMarkdown } from "../../utils/markdown";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import LoadingSpinner from "../common/LoadingSpinner";

const POST_ICONS = {
  announcement: Megaphone,
  task: Send,
  revision_plan: CalendarClock
};

const POST_LABELS = {
  announcement: "Announcement",
  task: "Task",
  revision_plan: "Revision plan"
};

export default function StreamTab({ classroomId, isTeacher }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ title: "", body_markdown: "", post_type: "announcement" });
  const [posting, setPosting] = useState(false);

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

  async function handlePost(event) {
    event.preventDefault();
    if (!draft.body_markdown.trim()) return;
    setPosting(true);
    try {
      await createPost(classroomId, draft);
      setDraft({ title: "", body_markdown: "", post_type: "announcement" });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-5">
      {isTeacher && (
        <form onSubmit={handlePost} className="glass-panel rounded-xl p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={draft.post_type}
              onChange={(e) => setDraft((d) => ({ ...d, post_type: e.target.value }))}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
            >
              <option value="announcement">Announcement</option>
              <option value="task">Task</option>
            </select>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Title (optional)"
              className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
            />
          </div>
          <textarea
            value={draft.body_markdown}
            onChange={(e) => setDraft((d) => ({ ...d, body_markdown: e.target.value }))}
            rows={3}
            placeholder="Share something with your class… (markdown supported)"
            className="mt-3 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
          />
          <div className="mt-3 flex justify-end">
            <Button type="submit" disabled={posting || !draft.body_markdown.trim()}>
              <Send className="h-4 w-4" />
              {posting ? "Posting…" : "Post"}
            </Button>
          </div>
        </form>
      )}

      {loading && <LoadingSpinner label="Loading stream" />}
      {error && <p className="text-sm text-rose">{error}</p>}
      {!loading && posts.length === 0 && (
        <EmptyState
          title="Nothing posted yet"
          description={isTeacher
            ? "Post an announcement, a task, or publish an AI revision plan from the AI Studio tab."
            : "Your teacher hasn't posted anything yet."}
        />
      )}

      <div className="space-y-4">
        {posts.map((post) => {
          const Icon = POST_ICONS[post.post_type] || Megaphone;
          const targeted = !post.audience_json?.all;
          return (
            <article key={post.id} className="glass-panel rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint/10 text-mint">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">{post.author_name}</span>
                    <span className="rounded-full bg-panel2 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      {POST_LABELS[post.post_type] || post.post_type}
                    </span>
                    {targeted && isTeacher && (
                      <span className="rounded-full bg-[#eda100]/15 px-2 py-0.5 text-xs font-semibold text-[#9a6a00]">
                        Targeted · {(post.audience_json?.student_ids || []).length} students
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              {post.title && (
                <h3 className="mt-3 text-lg font-semibold text-slate-100">{post.title}</h3>
              )}
              <div
                className="prose prose-sm mt-2 max-w-none text-slate-300 [&_h1]:text-lg [&_h2]:text-base [&_li]:my-0.5"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body_markdown) }}
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}
