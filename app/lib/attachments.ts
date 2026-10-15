/**
 * Composer attachments — files and photos the user hangs off a message.
 *
 * Deliberately in-memory only: previews are object URLs, which are browser
 * references that die with the document. Nothing here is persisted, and
 * nothing here may be written into `messagesByThread` — that map is
 * serialised to localStorage, and a couple of photos as data URLs would
 * blow its quota and take the whole thread history down with it.
 */

export type AttachmentKind = "image" | "file";

export type Attachment = {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  mime: string;
  kind: AttachmentKind;
  /** Object URL for preview — revoke via `releaseAttachments` when dropped. */
  url: string;
  /** Kept so the bytes are available if attachments are later sent upstream. */
  file: File;
};

export const MAX_ATTACHMENTS = 10;
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * The only file types Ask Wati takes, by extension: documents, spreadsheets
 * and PNG/JPEG images. Everything else — video, audio, archives,
 * executables, PPTX, WEBP, GIF — is turned away.
 */
const ALLOWED_EXTENSIONS = [
  "pdf", "doc", "docx", "txt", // documents
  "xls", "xlsx", "csv", // spreadsheets
  "png", "jpg", "jpeg", // images
] as const;

/** Handed to the picker so it only offers allowed types. Drops and an
 *  "All files" pick still go through `intakeFiles`. */
export const ATTACHMENT_ACCEPT = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",");

/** For copy: "PDF, DOC, DOCX, TXT, XLS, XLSX, CSV, PNG or JPG". */
export const ALLOWED_TYPES_LABEL = (() => {
  const labels = ALLOWED_EXTENSIONS.filter((e) => e !== "jpeg").map((e) => e.toUpperCase());
  return `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;
})();

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function isAllowedFile(file: File): boolean {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(extensionOf(file.name));
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
}

function createAttachment(file: File): Attachment {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    mime: file.type || "application/octet-stream",
    kind: isImageFile(file) ? "image" : "file",
    url: URL.createObjectURL(file),
    file,
  };
}

export type AttachmentIntake = {
  accepted: Attachment[];
  /** Human-readable reasons, ready to show as a single inline notice. */
  rejected: string[];
};

/**
 * Validate a drop/pick against what's already staged. Returns new
 * attachments plus a reason for anything turned away, so the composer can
 * say why rather than dropping files on the floor.
 */
export function intakeFiles(
  incoming: File[],
  staged: Attachment[],
): AttachmentIntake {
  const accepted: Attachment[] = [];
  const rejected: string[] = [];
  const unsupported: string[] = [];
  let slots = MAX_ATTACHMENTS - staged.length;

  for (const file of incoming) {
    if (!isAllowedFile(file)) {
      unsupported.push(file.name);
      continue;
    }
    if (slots <= 0) {
      rejected.push(`${file.name} — limit is ${MAX_ATTACHMENTS} attachments`);
      continue;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      rejected.push(
        `${file.name} — ${formatBytes(file.size)} exceeds the ${formatBytes(
          MAX_ATTACHMENT_BYTES,
        )} limit`,
      );
      continue;
    }
    // A zero-byte file is usually a folder dragged in, or a failed read.
    if (file.size === 0) {
      rejected.push(`${file.name} — empty file or folder`);
      continue;
    }
    const duplicate =
      staged.some((a) => a.name === file.name && a.size === file.size) ||
      accepted.some((a) => a.name === file.name && a.size === file.size);
    if (duplicate) {
      rejected.push(`${file.name} — already attached`);
      continue;
    }
    accepted.push(createAttachment(file));
    slots -= 1;
  }

  // One line for every wrong-type file, so a mixed drop reads cleanly.
  if (unsupported.length > 0) {
    const what = unsupported.length === 1 ? "isn't a supported file type" : "aren't supported file types";
    rejected.unshift(
      `${unsupported.join(", ")} ${what}. You can attach ${ALLOWED_TYPES_LABEL} files.`,
    );
  }

  return { accepted, rejected };
}

/** Release object URLs so the blobs can be collected. */
export function releaseAttachments(list: Attachment[]): void {
  for (const a of list) {
    URL.revokeObjectURL(a.url);
  }
}

/** Short, human label for the chip's second line. */
export function attachmentMeta(a: Attachment): string {
  const ext = a.name.includes(".")
    ? a.name.split(".").pop()!.toUpperCase()
    : a.kind === "image"
      ? "IMAGE"
      : "FILE";
  return `${ext} · ${formatBytes(a.size)}`;
}
