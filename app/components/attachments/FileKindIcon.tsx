"use client";

import {
  File as FileIcon,
  FileArchive,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import type { Attachment } from "../../lib/attachments";

/**
 * Glyph standing in for a non-image attachment. Chosen from the mime type
 * with the file extension as a fallback, since browsers leave `type` empty
 * for plenty of everyday formats (notably .csv on Windows).
 */
export function FileKindIcon({
  attachment,
  size = 16,
}: {
  attachment: Pick<Attachment, "mime" | "name">;
  size?: number;
}) {
  const Glyph = glyphFor(attachment.mime, attachment.name);
  return (
    <Glyph
      size={size}
      strokeWidth={1.75}
      className="text-[var(--wati-icon-default)]"
    />
  );
}

function glyphFor(mime: string, name: string) {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";

  if (mime.startsWith("image/")) return FileImage;
  if (mime === "application/json" || ext === "json") return FileJson;
  if (
    mime.includes("spreadsheet") ||
    mime === "text/csv" ||
    ["csv", "xls", "xlsx"].includes(ext)
  ) {
    return FileSpreadsheet;
  }
  if (
    mime.includes("zip") ||
    mime.includes("compressed") ||
    ["zip", "rar", "7z", "tar", "gz"].includes(ext)
  ) {
    return FileArchive;
  }
  if (
    mime === "application/pdf" ||
    mime.startsWith("text/") ||
    mime.includes("word") ||
    ["pdf", "txt", "doc", "docx", "md"].includes(ext)
  ) {
    return FileText;
  }
  return FileIcon;
}
