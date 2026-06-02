import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeMarkdown } from "@/lib/markdown";

export function ArticleBody({ markdown, title }: { markdown: string; title?: string }) {
  return (
    <div className="hm-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeMarkdown(markdown, { title })}</ReactMarkdown>
    </div>
  );
}
