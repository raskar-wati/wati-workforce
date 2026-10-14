"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import {
  attachmentMeta,
  type Attachment,
} from "../../lib/attachments";
import { FileKindIcon } from "./FileKindIcon";

/**
 * Attachments staged on the composer, shown above the input until the
 * message is sent. Images preview as a thumbnail; everything else gets a
 * type glyph plus name and size.
 */
export function AttachmentStagingRow({
  attachments,
  onRemove,
}: {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      <AnimatePresence initial={false}>
        {attachments.map((a) => (
          <motion.div
            key={a.id}
            layout
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className="group relative flex items-center gap-2 rounded-lg border border-wati-border bg-white py-1.5 pl-1.5 pr-7"
          >
            {a.kind === "image" ? (
              // Object URLs are browser-only references, so the image
              // optimizer cannot fetch them — a plain <img> is correct here.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.url}
                alt={a.name}
                className="h-8 w-8 shrink-0 rounded object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[var(--wati-surface-subtle)]">
                <FileKindIcon attachment={a} />
              </span>
            )}

            <span className="flex min-w-0 flex-col">
              <span className="max-w-[140px] truncate text-[12px] font-medium tracking-[-0.06px] text-[#0a0a0a]">
                {a.name}
              </span>
              <span className="text-[10px] uppercase tracking-[0.3px] text-black/45">
                {attachmentMeta(a)}
              </span>
            </span>

            <button
              type="button"
              onClick={() => onRemove(a.id)}
              aria-label={`Remove ${a.name}`}
              title="Remove"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded text-[var(--wati-icon-default)] hover:bg-black/[0.06]"
            >
              <X size={12} strokeWidth={2} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
