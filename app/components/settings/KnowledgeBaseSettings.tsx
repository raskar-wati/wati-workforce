"use client";

import { ArrowRight, CircleHelp, Database, Globe, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { HINT, INPUT, LIST } from "./settings-styles";

type KbTab = "web" | "documents" | "qa";

const EMPTY_COPY: Record<Exclude<KbTab, "web">, string> = {
  documents: "Upload PDFs, Word files or spreadsheets for Wati AI to learn from.",
  qa: "Add questions and the answers you want Wati AI to give.",
};

/**
 * What Wati AI draws on when it writes replies: web pages, documents and
 * Q&A. Web pages can be added here; the other two are placeholders.
 */
export function KnowledgeBaseSettings() {
  const [tab, setTab] = useState<KbTab>("web");
  const [pages, setPages] = useState<string[]>([]);
  const [url, setUrl] = useState("");

  const counts: Record<KbTab, number> = { web: pages.length, documents: 0, qa: 0 };
  const tabs: { id: KbTab; label: string }[] = [
    { id: "web", label: "Web pages" },
    { id: "documents", label: "Documents" },
    { id: "qa", label: "Q&A" },
  ];

  const addPage = () => {
    const clean = url.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!clean || pages.includes(clean)) return;
    setPages((p) => [...p, clean]);
    setUrl("");
  };

  return (
    <div className="flex min-h-full flex-col gap-5">
      <div>
        <h3 className="text-[14px] font-medium tracking-[-0.084px] text-[#0a0a0a]">
          Knowledge base
        </h3>
        <p className={`${HINT} mt-0.5`}>
          Content Wati AI uses to write accurate, on-brand replies for your customers.
        </p>
      </div>

      <div role="tablist" className="flex gap-1 self-start rounded-xl bg-[var(--wati-surface-subtle)] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-[13px] tracking-[-0.078px] ${
              tab === t.id
                ? "bg-white font-medium text-[#0a0a0a] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-black/60 hover:text-[#0a0a0a]"
            }`}
          >
            {t.label}
            <span className="ml-1 text-black/45">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {tab === "web" ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[var(--wati-border-default)] p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--wati-surface-subtle)] text-wati-green">
                <Globe size={18} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[#0a0a0a]">Import your website</p>
                <p className={HINT}>Paste your URL, we will scan and index it.</p>
              </div>
            </div>
            <form
              className="relative mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                addPage();
              }}
            >
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="yourbusiness.com"
                aria-label="Website URL"
                className={`${INPUT} pr-11`}
              />
              <button
                type="submit"
                aria-label="Add website"
                disabled={!url.trim()}
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-wati-green text-white disabled:bg-black/10"
              >
                <ArrowRight size={14} strokeWidth={2} />
              </button>
            </form>
            <ul className="mt-3 flex flex-col gap-1.5">
              <li className={`${HINT} flex items-center gap-2`}>
                <CircleHelp size={14} strokeWidth={1.75} className="shrink-0" />
                Internal links will not be scanned.
              </li>
              <li className={`${HINT} flex items-center gap-2`}>
                <ShieldAlert size={14} strokeWidth={1.75} className="shrink-0" />
                Avoid sharing sensitive personal, confidential or legal information.
              </li>
            </ul>
          </div>

          {pages.length > 0 && (
            <div className={LIST}>
              {pages.map((p) => (
                <div
                  key={p}
                  className="flex items-center gap-2.5 border-b border-black/[0.06] px-3 py-2.5 last:border-b-0"
                >
                  <Globe size={15} strokeWidth={1.75} className="shrink-0 text-black/55" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[#0a0a0a]">{p}</span>
                  <span className="rounded-full bg-[#e8f5ec] px-2 py-0.5 text-[11px] font-medium text-[#2e7d43]">
                    Indexed
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${p}`}
                    onClick={() => setPages((list) => list.filter((x) => x !== p))}
                    className="grid size-7 place-items-center rounded-md text-black/45 hover:bg-black/[0.04] hover:text-[#0a0a0a]"
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#cfd6de] px-4 py-7 text-center">
          <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-medium text-black/55">
            Coming soon
          </span>
          <p className={`${HINT} mx-auto mt-3 max-w-[420px] !text-[13px]`}>{EMPTY_COPY[tab]}</p>
        </div>
      )}

      <p className={`${HINT} mt-auto flex items-center gap-2 pt-2`}>
        <Database size={14} strokeWidth={1.75} className="shrink-0" />
        Knowledge base storage: {pages.length} {pages.length === 1 ? "source" : "sources"}
      </p>
    </div>
  );
}
