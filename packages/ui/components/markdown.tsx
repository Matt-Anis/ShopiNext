import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib/utils";

export interface MarkdownProps {
  content: string;
  className?: string;
}

const markdownComponents: Components = {
  h1: ({ children, className, ...props }) => (
    <h1
      className={cn(
        "font-heading text-2xl font-semibold text-foreground mt-6 mb-2 first:mt-0",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, className, ...props }) => (
    <h2
      className={cn(
        "font-heading text-xl font-semibold text-foreground mt-5 mb-2 first:mt-0",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, className, ...props }) => (
    <h3
      className={cn(
        "font-heading text-lg font-semibold text-foreground mt-4 mb-2 first:mt-0",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, className, ...props }) => (
    <h4
      className={cn(
        "font-heading text-base font-semibold text-foreground mt-3 mb-1 first:mt-0",
        className,
      )}
      {...props}
    >
      {children}
    </h4>
  ),
  p: ({ children, className, ...props }) => (
    <p
      className={cn(
        "leading-relaxed text-muted-foreground my-2 first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({ children, className, ...props }) => (
    <ul
      className={cn(
        "my-2 list-disc pl-5 space-y-1 text-muted-foreground marker:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, className, ...props }) => (
    <ol
      className={cn(
        "my-2 list-decimal pl-5 space-y-1 text-muted-foreground marker:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, className, ...props }) => (
    <li className={cn("leading-relaxed", className)} {...props}>
      {children}
    </li>
  ),
  strong: ({ children, className, ...props }) => (
    <strong
      className={cn("font-semibold text-foreground", className)}
      {...props}
    >
      {children}
    </strong>
  ),
  em: ({ children, className, ...props }) => (
    <em className={cn("italic", className)} {...props}>
      {children}
    </em>
  ),
  a: ({ href, children, className, ...props }) => {
    const isExternal =
      typeof href === "string" &&
      (href.startsWith("http://") || href.startsWith("https://"));

    return (
      <a
        href={href}
        className={cn(
          "text-primary underline underline-offset-4 hover:opacity-80 transition-opacity",
          className,
        )}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children, className, ...props }) => (
    <blockquote
      className={cn(
        "my-3 border-l-2 border-border pl-4 italic text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-4 border-border", className)} {...props} />
  ),
  code: ({ children, className, ...props }) => (
    <code
      className={cn(
        "rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground break-words",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, className, ...props }) => (
    <pre
      className={cn(
        "my-3 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground whitespace-pre-wrap break-words",
        className,
      )}
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, className, ...props }) => (
    <div className="my-3 w-full overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse border border-border text-sm text-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, className, ...props }) => (
    <thead className={cn("bg-muted/50", className)} {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, className, ...props }) => (
    <tbody className={cn("divide-y divide-border", className)} {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, className, ...props }) => (
    <tr className={cn("border-b border-border", className)} {...props}>
      {children}
    </tr>
  ),
  th: ({ children, className, ...props }) => (
    <th
      className={cn(
        "border-r border-border px-3 py-2 text-left font-medium last:border-r-0",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, className, ...props }) => (
    <td
      className={cn(
        "border-r border-border px-3 py-2 text-muted-foreground last:border-r-0",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  ),
};

export function Markdown({ content, className }: MarkdownProps) {
  if (!content) return null;

  return (
    <div className={cn("w-full min-w-0 space-y-2 break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
