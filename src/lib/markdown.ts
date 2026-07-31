import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export async function renderMarkdownToHtml(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(md);
  return String(file);
}

export function countWords(md: string): number {
  const stripped = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#*_>~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return 0;
  const hasCJK = /[一-龥぀-ゟ゠-ヿ]/.test(stripped);
  if (hasCJK) {
    const cjk = (stripped.match(/[一-龥぀-ゟ゠-ヿ]/g) ?? []).length;
    const ascii = (stripped.match(/[a-zA-Z0-9]+/g) ?? []).length;
    return cjk + ascii;
  }
  return (stripped.match(/\S+/g) ?? []).length;
}

export function readingTime(words: number): number {
  return Math.max(1, Math.ceil(words / 220));
}
