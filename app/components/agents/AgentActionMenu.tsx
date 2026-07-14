"use client";

import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function AgentActionMenu({
  status,
  onRename,
  onToggleStatus,
  onDelete,
}: {
  status: "active" | "paused";
  onRename: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Agent options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] text-black/60 hover:bg-black/[0.08] hover:text-[#0a0a0a]"
      >
        <MoreHorizontal size={16} strokeWidth={2} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
        >
          <MenuItem
            icon={<Pencil size={14} strokeWidth={1.75} />}
            label="Rename"
            onClick={() => {
              close();
              onRename();
            }}
          />
          <MenuItem
            icon={<Power size={14} strokeWidth={1.75} />}
            label={status === "active" ? "Mark as inactive" : "Mark as active"}
            onClick={() => {
              close();
              onToggleStatus();
            }}
          />
          <div className="my-1 h-px bg-black/[0.06]" />
          <MenuItem
            icon={<Trash2 size={14} strokeWidth={1.75} />}
            label="Delete agent"
            danger
            onClick={() => {
              close();
              onDelete();
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] tracking-[-0.078px] ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-[#0a0a0a] hover:bg-black/[0.04]"
      }`}
    >
      <span className={danger ? "text-red-500" : "text-black/55"}>{icon}</span>
      {label}
    </button>
  );
}
