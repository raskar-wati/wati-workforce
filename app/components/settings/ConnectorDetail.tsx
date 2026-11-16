"use client";

import { ArrowLeft } from "lucide-react";
import { useAskWatiSettings } from "../../lib/ask-wati-settings";
import {
  PERMISSION_LABELS,
  TOOL_KIND_LABELS,
  type Connector,
  type ToolKind,
  type ToolPermission,
} from "../../lib/connectors-data";
import { ConnectorTile } from "./ConnectorTile";
import { Select } from "../ui/Select";
import { BADGE, BTN_OUTLINE, HINT, SECTION_LABEL } from "./settings-styles";

const PERMISSIONS = Object.entries(PERMISSION_LABELS) as [ToolPermission, string][];
const KINDS: ToolKind[] = ["read", "write"];

/** One connector: what it is, and what Wati AI may do with each of its tools. */
export function ConnectorDetail({
  connector: c,
  onBack,
  onEdit,
  onDisconnected,
}: {
  connector: Connector;
  onBack: () => void;
  onEdit: () => void;
  onDisconnected: () => void;
}) {
  const { setToolPermission, setKindPermission, reconnect, disconnect } = useAskWatiSettings();
  const interactive = c.tools.some((t) => t.kind === "write");

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 self-start text-[12px] text-black/60 hover:text-[#0a0a0a]"
      >
        <ArrowLeft size={13} strokeWidth={1.75} />
        Connectors
      </button>

      <div className="flex items-center gap-3">
        <ConnectorTile name={c.name} logo={c.logo} custom={c.custom} size="lg" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[16px] font-medium tracking-[-0.096px] text-[#0a0a0a]">
            {c.name}
            <span className={BADGE}>{interactive ? "Interactive" : "Read-only"}</span>
          </p>
          <p className={HINT}>{c.host}</p>
        </div>
        <div className="ml-auto flex gap-2">
          {c.custom && (
            <button type="button" className={BTN_OUTLINE} onClick={onEdit}>
              Edit
            </button>
          )}
          {c.expired ? (
            <button type="button" className={BTN_OUTLINE} onClick={() => reconnect(c.id)}>
              Reconnect
            </button>
          ) : (
            !c.builtIn && (
              <button
                type="button"
                className={BTN_OUTLINE}
                onClick={() => {
                  disconnect(c.id);
                  onDisconnected();
                }}
              >
                Disconnect
              </button>
            )
          )}
        </div>
      </div>

      {c.expired && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-700">
          Sign-in expired. Reconnect to use {c.name} again.
        </p>
      )}

      <p className="max-w-[74ch] text-[13px] leading-[1.6] text-black/70">{c.description}</p>

      <section>
        <p className={`${SECTION_LABEL} mb-2`}>Tool permissions</p>
        <div className="flex flex-col gap-3">
          {KINDS.map((kind) => {
            const tools = c.tools.filter((t) => t.kind === kind);
            if (tools.length === 0) return null;
            const shared = tools.every((t) => t.permission === tools[0].permission)
              ? tools[0].permission
              : "mixed";
            return (
              <div
                key={kind}
                className="overflow-hidden rounded-xl border border-[var(--wati-border-default)]"
              >
                <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] bg-[#fafafa] px-3 py-2">
                  <span className="text-[12px] font-medium text-[#0a0a0a]">
                    {TOOL_KIND_LABELS[kind]}
                    <span className="ml-1.5 font-normal text-black/55">{tools.length}</span>
                  </span>
                  <Select
                    aria-label={`${TOOL_KIND_LABELS[kind]}: permission for all`}
                    value={shared}
                    onChange={(e) => {
                      if (e.target.value === "mixed") return;
                      setKindPermission(c.id, kind, e.target.value as ToolPermission);
                    }}
                  >
                    {shared === "mixed" && <option value="mixed">Mixed</option>}
                    {PERMISSIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                {tools.map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center gap-2.5 border-b border-black/[0.06] px-3 py-2 last:border-b-0"
                  >
                    <span className="flex-1 text-[13px] text-[#0a0a0a]">{t.name}</span>
                    <Select
                      aria-label={`${t.name}: permission`}
                      value={t.permission}
                      onChange={(e) =>
                        setToolPermission(c.id, t.name, e.target.value as ToolPermission)
                      }
                    >
                      {PERMISSIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
