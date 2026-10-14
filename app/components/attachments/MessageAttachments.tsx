"use client";

import { attachmentMeta, type Attachment } from "../../lib/attachments";
import { FileKindIcon } from "./FileKindIcon";

/**
 * Attachments as they appear under a sent user message. Photos render as a
 * thumbnail grid that opens full size in a new tab; other files render as
 * rows that download on click.
 *
 * These live only for the session — see `lib/attachments`. After a reload
 * the message keeps its text and the attachments are gone, so this renders
 * nothing rather than leaving broken previews behind.
 */
export function MessageAttachments({
  attachments,
}: {
  attachments: Attachment[];
}) {
  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => a.kind === "image");
  const files = attachments.filter((a) => a.kind === "file");

  return (
    <div className="mt-2 flex flex-col items-end gap-2">
      {images.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2">
          {images.map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${a.name} — ${attachmentMeta(a)}`}
              className="block overflow-hidden rounded-lg border border-wati-border transition-opacity hover:opacity-90"
            >
              {/* Object URL — not fetchable by the image optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url}
                alt={a.name}
                className="h-28 w-28 object-cover"
              />
            </a>
          ))}
        </div>
      )}

      {files.map((a) => (
        <a
          key={a.id}
          href={a.url}
          download={a.name}
          title={`Download ${a.name}`}
          className="flex max-w-[260px] items-center gap-2 rounded-lg border border-wati-border bg-white px-2.5 py-2 transition-colors hover:bg-black/[0.03]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[var(--wati-surface-subtle)]">
            <FileKindIcon attachment={a} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[12px] font-medium tracking-[-0.06px] text-[#0a0a0a]">
              {a.name}
            </span>
            <span className="text-[10px] uppercase tracking-[0.3px] text-black/45">
              {attachmentMeta(a)}
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}
