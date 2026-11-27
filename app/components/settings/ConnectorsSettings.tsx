"use client";

import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { useAskWatiSettings } from "../../lib/ask-wati-settings";
import { POPULAR_APPS } from "../../lib/connectors-data";
import { Switch } from "../ui/Switch";
import { AddMcpServerSheet } from "./AddMcpServerSheet";
import { ConnectorDetail } from "./ConnectorDetail";
import { ConnectorTile } from "./ConnectorTile";
import { BADGE, BTN_OUTLINE, BTN_SM, HINT, LIST, SECTION_LABEL } from "./settings-styles";

/**
 * Connectors tab: the connectors already added (open one to set its tool
 * permissions), then the apps that can still be added in one click, and
 * the custom MCP server sheet.
 */
export function ConnectorsSettings() {
  const { connectors, setEnabled, reconnect, connectApp } = useAskWatiSettings();
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ editId: string | null } | null>(null);
  const [signingIn, setSigningIn] = useState<string | null>(null);

  const open = openId ? connectors.find((c) => c.id === openId) : undefined;
  const available = POPULAR_APPS.filter((a) => !connectors.some((c) => c.appId === a.id));

  const connect = (appId: string) => {
    setSigningIn(appId);
    // Stands in for the app's sign-in pop-up.
    window.setTimeout(() => {
      connectApp(appId);
      setSigningIn(null);
    }, 900);
  };

  return (
    <>
      {open ? (
        <ConnectorDetail
          connector={open}
          onBack={() => setOpenId(null)}
          onEdit={() => setSheet({ editId: open.id })}
          onDisconnected={() => setOpenId(null)}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-[14px] font-semibold tracking-[-0.084px] text-[#0a0a0a]">
                Connectors
              </h3>
              <p className={`${HINT} mt-0.5`}>Apps Wati AI can use in your chats.</p>
            </div>
            <button
              type="button"
              className={`${BTN_OUTLINE} flex shrink-0 items-center gap-1`}
              onClick={() => setSheet({ editId: null })}
            >
              <Plus size={14} strokeWidth={2} />
              Custom server
            </button>
          </div>

          {available.length > 0 && (
            <section>
              <p className={`${SECTION_LABEL} mb-2`}>Add an app</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {available.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--wati-border-default)] px-3 py-2.5"
                  >
                    <ConnectorTile name={app.name} logo={app.logo} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-[#0a0a0a]">
                        {app.name}
                      </span>
                      <span className="block truncate text-[12px] text-black/55">
                        {app.summary}
                      </span>
                    </span>
                    <button
                      type="button"
                      className={`${BTN_OUTLINE} ${BTN_SM} shrink-0`}
                      disabled={signingIn === app.id}
                      onClick={() => connect(app.id)}
                    >
                      {signingIn === app.id ? "Connecting…" : "Connect"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <p className={`${SECTION_LABEL} mb-2`}>Connected</p>
            <div className={LIST}>
              {connectors.map((c) => (
                <div
                  key={c.id}
                  className="group flex items-center gap-3 border-b border-black/[0.06] px-3 py-2.5 last:border-b-0 hover:bg-black/[0.02]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(c.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <ConnectorTile
                      name={c.name}
                      logo={c.logo}
                      custom={c.custom}
                      expired={c.expired}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`flex items-center gap-1.5 text-[13px] font-medium ${
                          c.enabled || c.expired ? "text-[#0a0a0a]" : "text-black/45"
                        }`}
                      >
                        {c.name}
                        {c.builtIn && <span className={BADGE}>Built in</span>}
                        {c.custom && <span className={BADGE}>Custom</span>}
                      </span>
                      <span className="block truncate text-[12px] text-black/55">
                        {c.expired ? (
                          <span className="text-red-600">Sign-in expired</span>
                        ) : (
                          c.summary
                        )}
                      </span>
                    </span>
                    <ChevronRight
                      size={14}
                      strokeWidth={2}
                      className="shrink-0 text-black/25 group-hover:text-black/50"
                    />
                  </button>
                  {c.expired ? (
                    <button
                      type="button"
                      className={`${BTN_OUTLINE} ${BTN_SM}`}
                      onClick={() => reconnect(c.id)}
                    >
                      Reconnect
                    </button>
                  ) : (
                    <Switch
                      small
                      checked={c.enabled}
                      onChange={(v) => setEnabled(c.id, v)}
                      label={`Use ${c.name} in chats`}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {sheet && (
        <AddMcpServerSheet
          editing={sheet.editId ? connectors.find((c) => c.id === sheet.editId) : undefined}
          onClose={() => setSheet(null)}
          onSaved={(id) => {
            setSheet(null);
            setOpenId(id);
          }}
        />
      )}
    </>
  );
}
