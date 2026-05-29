import { renderMarkdown } from "../../utils/markdown";

export default function LessonViewer({ content }) {
  return (
    <article
      className="markdown-body max-w-none"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content || "") }}
    />
  );
}
