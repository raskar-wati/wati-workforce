"use client";

import { BookOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAskWatiSettings } from "../../lib/ask-wati-settings";

/** Icons exported from the Settings IA Figma (chat area + Wati AI menu). */
const ICON = (name: string) => `/inbox-composer/${name}.svg`;

const TOOLS = [
  { icon: "ai-bot", label: "AI agent" },
  { icon: "quick-reply", label: "Quick reply" },
  { icon: "template", label: "Template" },
];
const MEDIA = [
  { icon: "attachment", label: "Attachment", w: 20 },
  { icon: "voice", label: "Voice message", w: 14 },
];
const EXTRAS = [
  { icon: "emoji", label: "Emoji", w: 17, h: 17 },
  { icon: "sticker", label: "Sticker", w: 18, h: 17 },
];

const AI_ACTIONS = [
  { icon: "generate", label: "Generate Response", inset: "p-[0.67px]" },
  { icon: "grammar", label: "Fix Grammar" },
  { icon: "improve", label: "Improve Writing" },
  { icon: "tone", label: "Match Tone", inset: "p-[1.33px]" },
  { icon: "knowledge", label: "Add To Knowledge Base" },
];

/**
 * Team Inbox reply box, per the Settings IA "Chat area" frame. The Wati AI
 * mark opens the Wati AI menu; its Settings item opens Wati AI settings on
 * the Conversations tab.
 */
export function InboxComposer() {
  const [mode, setMode] = useState<"reply" | "note">("reply");
  return (
    <div className="shrink-0 bg-white p-3">
      <div className="rounded-lg border border-[var(--wati-border-default)] bg-white py-2 pl-3 pr-0.5">
        <div className="inline-flex h-8 gap-0 rounded-lg bg-[var(--wati-surface-subtle)] p-1 shadow-[inset_2px_2px_2px_0_#e7e9e8]">
          {(["reply", "note"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex min-h-6 items-center gap-1 rounded-lg px-2 py-0.5 text-[12px] font-medium leading-3 text-[#353735] ${
                mode === m ? "bg-white shadow-[0_1px_1px_rgba(27,29,28,0.05)]" : ""
              }`}
            >
              {m === "reply" ? "Reply" : "Note"}
              {m === "note" && <img src={ICON("note-info")} alt="" className="size-3" />}
            </button>
          ))}
        </div>

        <div className="pt-2">
          <textarea
            rows={2}
            aria-label="Message"
            placeholder="Type your message here or press / key for quick replies."
            className="block h-[46px] w-full resize-none bg-transparent pr-3 text-[14px] leading-5 text-[#353735] outline-none placeholder:text-[#b7b9b7]"
          />
          <div className="flex items-center justify-between pr-2.5">
            <div className="flex items-center gap-2.5">
              <WatiAiMenu />
              <div className="flex items-center gap-3">
                {TOOLS.map((t) => (
                  <IconButton key={t.icon} icon={t.icon} label={t.label} />
                ))}
                <div className="flex items-center gap-3 border-x border-[#ced0ce] px-3">
                  {MEDIA.map((t) => (
                    <IconButton key={t.icon} icon={t.icon} label={t.label} w={t.w} />
                  ))}
                </div>
                {EXTRAS.map((t) => (
                  <IconButton key={t.icon} icon={t.icon} label={t.label} w={t.w} h={t.h} />
                ))}
              </div>
            </div>
            <button
              type="button"
              className="ml-3 flex h-8 items-center rounded-[5px] bg-wati-green px-2.5 text-[16px] leading-6 text-white hover:bg-[var(--wati-green-hover)]"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  icon,
  label,
  w = 20,
  h = 20,
}: {
  icon: string;
  label: string;
  w?: number;
  h?: number;
}) {
  return (
    <button type="button" aria-label={label} className="flex items-start rounded hover:opacity-70">
      <img src={ICON(icon)} alt="" style={{ width: w, height: h }} />
    </button>
  );
}

function WatiAiMenu() {
  const { openSettings } = useAskWatiSettings();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex h-7 w-full items-center gap-1 rounded py-1 text-left text-[14px] leading-[17.5px] text-[#353735] hover:bg-[var(--wati-surface-subtle)]";

  return (
    <div ref={rootRef} className="relative flex">
      <button
        type="button"
        aria-label="Wati AI"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex rounded hover:opacity-80"
      >
        <img src={ICON("wati-ai")} alt="" className="size-5" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Wati AI"
          className="absolute bottom-8 left-0 z-50 w-[289px] rounded-xl bg-white shadow-[0_10px_7.5px_rgba(27,29,28,0.1),0_4px_3px_rgba(27,29,28,0.1)]"
        >
          <div className="flex items-center gap-1 p-3">
            <img src={ICON("menu-wati-ai")} alt="" className="size-5" />
            <span className="bg-[linear-gradient(170deg,#23a455_8.6%,#00e785_91.4%)] bg-clip-text text-[14px] font-medium leading-5 text-transparent">
              Wati AI
            </span>
            <span className="rounded-lg bg-[#e4f8f0] px-1.5 py-0.5 text-[10px] leading-[15px] text-[#00872f]">
              Beta
            </span>
          </div>
          <div className="flex flex-col gap-1 px-3 py-2">
            {AI_ACTIONS.map((a) => (
              <button key={a.icon} type="button" role="menuitem" onClick={() => setOpen(false)} className={item}>
                <span className="grid size-5 place-items-center">
                  <img src={ICON(a.icon)} alt="" className={`size-4 ${a.inset ?? ""}`} />
                </span>
                {a.label}
              </button>
            ))}
            <div role="separator" className="h-px bg-[var(--wati-border-default)]" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                openSettings("conversations");
              }}
              className={item}
            >
              <span className="grid size-5 place-items-center">
                <img src={ICON("settings")} alt="" className="size-4" />
              </span>
              Settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                openSettings("knowledge");
              }}
              className={item}
            >
              <span className="grid size-5 place-items-center text-[#353735]">
                <BookOpen size={16} strokeWidth={1.5} />
              </span>
              Knowledge Base
            </button>
            <button type="button" role="menuitem" onClick={() => setOpen(false)} className={item}>
              <span className="grid size-5 place-items-center">
                <img src={ICON("tutorial")} alt="" className="h-[15px] w-[10px]" />
              </span>
              Start Tutorial
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
