import { toText } from "hast-util-to-text";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype);

export function descriptionToText(description: string | null): string {
  if (!description) return "";
  const tree = processor.runSync(processor.parse(description));
  return toText(tree).replace(/\s+/gu, " ").trim();
}
