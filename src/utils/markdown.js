import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false
});

export function renderMarkdown(markdown = "") {
  return marked.parse(markdown || "");
}
