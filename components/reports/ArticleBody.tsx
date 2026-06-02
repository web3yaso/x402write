import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeMarkdown } from "@/lib/markdown";

export function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <div className="hm-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeMarkdown(markdown)}</ReactMarkdown>
    </div>
  );
}
