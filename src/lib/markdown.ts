import "server-only";

import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypePrettyCode, {
    theme: {
      light: "github-light",
      dark: "github-dark-default",
    },
    keepBackground: false,
    defaultLang: "text",
  })
  .use(rehypeStringify);

/** Lesson content is authored by LearnCode and stored in the database. */
export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await processor.process(markdown);
  return String(file);
}
