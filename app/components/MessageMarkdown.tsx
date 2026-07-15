"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentProps } from "react";

type MarkdownComponents = ComponentProps<typeof ReactMarkdown>["components"];

const components: MarkdownComponents = {
  p: ({ children }) => (
    <p className="my-0 whitespace-pre-wrap [&:not(:first-child)]:mt-2">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-black/85">{children}</strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-wati-green-text underline decoration-wati-green-soft-hover underline-offset-2 hover:decoration-wati-green"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-2 flex list-disc flex-col gap-1 pl-5 marker:text-black/35">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 flex list-decimal flex-col gap-1 pl-5 marker:text-black/45">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  h1: ({ children }) => (
    <h3 className="mt-3 mb-1 text-[14px] font-semibold text-black/85 first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mt-3 mb-1 text-[14px] font-semibold text-black/85 first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1 text-[14px] font-semibold text-black/85 first:mt-0">{children}</h3>
  ),
  code: ({ children, className }) =>
    className ? (
      <code className={`${className} font-mono text-[12.5px]`}>{children}</code>
    ) : (
      <code className="rounded bg-black/[0.06] px-1 py-0.5 font-mono text-[12.5px] text-black/75">
        {children}
      </code>
    ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg border border-wati-border bg-black/[0.03] p-3 text-[12.5px] leading-[18px]">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-wati-border-strong pl-3 text-black/60">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-wati-border" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-lg border border-wati-border">
      <table className="w-full border-collapse text-[13px] leading-[19px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-black/[0.03] text-left">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-wati-border px-2.5 py-1.5 font-medium text-black/60">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-wati-border px-2.5 py-1.5 last:border-b-0 [tr:last-child_&]:border-b-0">
      {children}
    </td>
  ),
};

/**
 * Renders assistant chat answers. The PRD's answer card is
 * narrative + data table + chart; this covers the narrative and table
 * portions with GFM so streamed markdown never shows raw syntax.
 */
export default function MessageMarkdown({ content }: { content: string }) {
  return (
    <div className="text-[14px] leading-[21px] text-black/80">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
