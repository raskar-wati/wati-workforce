"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAskWatiDrawer } from "./ask-wati-drawer";
import { META_REVIEW_MS } from "./agents";
import { useNotifications } from "./notifications";
import type { TemplateDraft } from "./template-draft";

/**
 * WhatsApp templates created from chat. Lives above the chat surfaces (like
 * the agents store) so Meta's review keeps running — and its island notice
 * still fires — after the drawer closes.
 */

export type TemplateStatus = "draft" | "pending-meta" | "approved";

export type SavedTemplate = {
  id: string;
  /** Chat thread the template was made in — where "open" goes back to. */
  threadId: string;
  draft: TemplateDraft;
  status: TemplateStatus;
  submittedAt?: number;
  updatedAt: number;
};

type TemplatesCtx = {
  templates: SavedTemplate[];
  getTemplate: (id: string) => SavedTemplate | undefined;
  /** Names already used, optionally ignoring one template (its own name). */
  takenNames: (exceptId?: string) => string[];
  /** Create or update the template as an unsubmitted draft. */
  saveDraft: (threadId: string, draft: TemplateDraft, id?: string) => string;
  /** Create or update, then send to Meta for review. */
  submit: (threadId: string, draft: TemplateDraft, id?: string) => string;
};

const Ctx = createContext<TemplatesCtx | null>(null);

const STORAGE_KEY = "wati.templates.v1";

export function TemplatesProvider({ children }: { children: ReactNode }) {
  const outer = useContext(Ctx);
  if (outer) return <>{children}</>;
  return <TemplatesStore>{children}</TemplatesStore>;
}

function TemplatesStore({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { push, registerSource } = useNotifications();
  const { openThread } = useAskWatiDrawer();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setTemplates(JSON.parse(raw));
    } catch {
      // Corrupt storage — start clean.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch {
      // Storage full/unavailable — templates stay session-only.
    }
  }, [templates, hydrated]);

  // Meta's review: each pending template approves once its window passes.
  useEffect(() => {
    const timers = templates
      .filter((t) => t.status === "pending-meta" && t.submittedAt)
      .map((t) =>
        window.setTimeout(
          () => {
            setTemplates((prev) =>
              prev.map((x) =>
                x.id === t.id && x.status === "pending-meta"
                  ? { ...x, status: "approved", updatedAt: Date.now() }
                  : x,
              ),
            );
            push({
              id: `templates:approved:${t.id}`,
              source: "templates",
              kind: "approved",
              priority: "info",
              island: true,
              title: "Template approved by Meta",
              body: `${t.draft.name} is ready to use in broadcasts`,
            });
          },
          Math.max(0, t.submittedAt! + META_REVIEW_MS - Date.now()),
        ),
      );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [templates, push]);

  useEffect(
    () =>
      registerSource("templates", {
        open: (notice) => {
          const id = notice.id.split(":").pop();
          const t = templates.find((x) => x.id === id);
          if (t) openThread(t.threadId);
        },
      }),
    [registerSource, templates, openThread],
  );

  const upsert = useCallback(
    (threadId: string, draft: TemplateDraft, status: TemplateStatus, id?: string) => {
      const tid = id ?? crypto.randomUUID();
      const now = Date.now();
      setTemplates((prev) => {
        const rest = prev.filter((t) => t.id !== tid);
        return [
          {
            id: tid,
            threadId,
            draft,
            status,
            submittedAt: status === "pending-meta" ? now : undefined,
            updatedAt: now,
          },
          ...rest,
        ];
      });
      return tid;
    },
    [],
  );

  const value = useMemo<TemplatesCtx>(
    () => ({
      templates,
      getTemplate: (id) => templates.find((t) => t.id === id),
      takenNames: (exceptId) =>
        templates.filter((t) => t.id !== exceptId).map((t) => t.draft.name),
      saveDraft: (threadId, draft, id) => upsert(threadId, draft, "draft", id),
      submit: (threadId, draft, id) => upsert(threadId, draft, "pending-meta", id),
    }),
    [templates, upsert],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTemplates(): TemplatesCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTemplates must be used inside TemplatesProvider");
  return ctx;
}
