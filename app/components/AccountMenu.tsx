"use client";

import {
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  CircleUserRound,
  ChevronRight,
  Keyboard,
  LifeBuoy,
  Link2,
  LogOut,
  PlayCircle,
  Ticket,
  User,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Select } from "./ui/Select";

const SETTINGS_PAGE = "/preview/settings";

/** Demo identity for the prototype. */
const ME = {
  name: "Alex Morgan",
  email: "alex@yourbrand.com",
  clientId: "204318",
};

/**
 * Header account button and its menu. Grouped as: who you are, your chat
 * link and your status; your preferences; help; then the
 * apps and sign out.
 */
export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("active");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-[var(--wati-icon-default)] hover:bg-black/[0.04]"
      >
        <User size={20} strokeWidth={1.75} />
        <StatusIcon
          status={status}
          ring
          className="absolute bottom-0 right-0"
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Account"
          className="absolute right-0 top-[50px] z-[90] flex max-h-[calc(100vh-64px)] w-[340px] flex-col overflow-y-auto rounded-2xl border border-[var(--wati-border-default)] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
        >
          <Identity
            status={status}
            onStatusChange={setStatus}
            onNavigate={() => setOpen(false)}
          />
          <Section title="Preferences">
            <MenuRow
              icon={Bell}
              label="Notifications"
              href={SETTINGS_PAGE}
              onNavigate={() => setOpen(false)}
            />
            <div className="flex items-center gap-2.5 px-4 py-1.5">
              <BookOpen
                size={16}
                strokeWidth={1.75}
                className="shrink-0 text-black/55"
              />
              <span className="flex-1 text-[13px] text-[#0a0a0a]">
                Language
              </span>
              <Select aria-label="Language" defaultValue="Default">
                {[
                  "Default",
                  "English",
                  "Español",
                  "Português",
                  "Bahasa Indonesia",
                ].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </Select>
            </div>
          </Section>
          <Section title="Help">
            <div className="grid grid-cols-2 gap-1 px-2">
              <HelpTile icon={LifeBuoy} label="Help center" />
              <HelpTile icon={Keyboard} label="Shortcuts" />
              <HelpTile icon={PlayCircle} label="Tutorials" />
              <HelpTile icon={UsersRound} label="Community" />
              <HelpTile icon={Ticket} label="Submit a ticket" />
            </div>
          </Section>
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="whitespace-nowrap text-[12px] text-black/50">
              Get the app
            </span>
            <AppLink logo="/brand/apple.svg" label="iOS" />
            <AppLink logo="/brand/android.svg" label="Android" />
            <button
              type="button"
              className="ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut size={14} strokeWidth={2} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type Status = "active" | "offline" | "away";

/** Shared look of the controls in the identity block. */
const CONTROL =
  "h-8 rounded-lg border border-[var(--wati-border-default)] bg-white text-[12px] font-medium text-[#0a0a0a] hover:bg-black/[0.03]";

const STATUSES: { id: Status; label: string; body?: string }[] = [
  { id: "active", label: "Active" },
  { id: "offline", label: "Offline" },
  {
    id: "away",
    label: "Away",
    body: "Pauses round robin and auto chat assignments. WhatsApp calls continue to be assigned",
  },
];

/** Green dot, red dot, or the orange away mark. */
function StatusIcon({
  status,
  size = 10,
  ring = false,
  className = "",
}: {
  status: Status;
  size?: number;
  /** White ring, for sitting on top of an avatar. */
  ring?: boolean;
  className?: string;
}) {
  const ringCls = ring ? "rounded-full ring-2 ring-white" : "";
  if (status === "away") {
    return (
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox="0 0 12 12"
        className={`shrink-0 ${ringCls} ${className}`}
      >
        <circle cx="6" cy="6" r="6" fill="#F59E0B" />
        <path d="M6 2.6a3.4 3.4 0 1 0 3.4 3.4H6z" fill="#fff" />
      </svg>
    );
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-full ${status === "active" ? "bg-wati-green" : "bg-[#E5484D]"} ${ringCls} ${className}`}
    />
  );
}

function StatusPicker({
  status,
  onChange,
}: {
  status: Status;
  onChange: (s: Status) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = STATUSES.find((s) => s.id === status)!;
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Status: ${current.label}`}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 px-3 ${CONTROL}`}
      >
        <span className="font-normal text-black/55">Status</span>
        <StatusIcon status={status} className="ml-auto" />
        {current.label}
        <ChevronDown
          size={13}
          strokeWidth={2}
          className={`text-black/50 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Status"
          className="absolute left-0 top-9 z-10 w-[306px] overflow-hidden rounded-xl border border-[var(--wati-border-default)] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          {STATUSES.map((s) => {
            const selected = s.id === status;
            return (
              <li key={s.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(s.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start gap-2.5 px-3 py-2 text-left ${
                    selected
                      ? "bg-[var(--wati-surface-subtle)]"
                      : "hover:bg-black/[0.03]"
                  }`}
                >
                  <span className="mt-[5px]">
                    <StatusIcon status={s.id} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[13px] ${selected ? "font-medium text-[#0a0a0a]" : "text-black/70"}`}
                    >
                      {s.label}
                    </span>
                    {s.body && (
                      <span className="block text-[12px] leading-[1.45] text-black/55">
                        {s.body}
                      </span>
                    )}
                  </span>
                  {selected && (
                    <Check
                      size={14}
                      strokeWidth={2}
                      className="mt-[3px] shrink-0 text-wati-green"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Identity({
  status,
  onStatusChange,
  onNavigate,
}: {
  status: Status;
  onStatusChange: (s: Status) => void;
  onNavigate: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-2.5">
        <span className="text-[12px] text-black/55">Client ID</span>
        <span className="text-[13px] font-semibold tracking-[0.08em] text-[#353735]">
          {ME.clientId}
        </span>
      </div>
      <div className="border-b border-black/[0.06] bg-[var(--wati-surface-subtle)] p-4">
        <div className="flex items-center gap-3">
          <span className="relative size-11 shrink-0 text-[#666]">
            <CircleUserRound size={44} strokeWidth={1.25} />
            <StatusIcon
              status={status}
              size={12}
              ring
              className="absolute bottom-0 right-0"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-[#0a0a0a]">
              {ME.name}
            </p>
            <p className="truncate text-[12px] text-black/60">{ME.email}</p>
          </div>
          <Link
            href={SETTINGS_PAGE}
            onClick={onNavigate}
            className="shrink-0 self-start text-[13px] font-medium text-[#1570EF] hover:underline"
          >
            Edit profile
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatusPicker status={status} onChange={onStatusChange} />
          <CopyLinkButton />
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-black/[0.06] py-2 last:border-b-0">
      <p className="px-4 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-black/45">
        {title}
      </p>
      {children}
    </div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  trailing,
  href,
  onNavigate,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  trailing?: React.ReactNode;
  href?: string;
  onNavigate?: () => void;
  onClick?: () => void;
}) {
  const body = (
    <>
      <Icon size={16} strokeWidth={1.75} className="shrink-0 text-black/55" />
      <span className="flex-1 text-[13px] text-[#0a0a0a]">{label}</span>
      {trailing ?? (
        <ChevronRight
          size={14}
          strokeWidth={2}
          className="shrink-0 text-black/30"
        />
      )}
    </>
  );
  const cls =
    "flex w-full items-center gap-2.5 px-4 py-2 text-left hover:bg-black/[0.03]";
  return href ? (
    <Link href={href} onClick={onNavigate} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

function PillButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 whitespace-nowrap px-2.5 ${CONTROL}`}
    >
      <Icon size={13} strokeWidth={1.75} className="shrink-0 text-black/60" />
      {label}
    </button>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  return (
    <PillButton
      icon={copied ? Check : Link2}
      label={copied ? "Link copied" : "Copy chat link"}
      onClick={() => {
        try {
          void navigator.clipboard?.writeText("https://wa.me/");
        } catch {}
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    />
  );
}

function HelpTile({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] text-[#0a0a0a] hover:bg-black/[0.03]"
    >
      <Icon size={15} strokeWidth={1.75} className="shrink-0 text-black/55" />
      {label}
    </button>
  );
}

function AppLink({ logo, label }: { logo: string; label: string }) {
  return (
    <button
      type="button"
      aria-label={`Get the ${label} app`}
      className="flex items-center gap-1 rounded-full border border-[var(--wati-border-default)] px-2 py-0.5 text-[12px] text-black/70 hover:bg-black/[0.03]"
    >
      <img src={logo} alt="" className="size-3" />
      {label}
    </button>
  );
}
