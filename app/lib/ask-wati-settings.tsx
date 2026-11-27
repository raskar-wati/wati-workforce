"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CUSTOM_SERVER_TOOLS,
  POPULAR_APPS,
  SEED_CONNECTORS,
  type Connector,
  type ToolKind,
  type ToolPermission,
} from "./connectors-data";

/**
 * Wati AI settings: Connectors (built), Skills and Memory (placeholders),
 * plus Conversations (the Team inbox AI features).
 *
 * Reached from two places: the Connectors row in the composer's + menu, and
 * the Settings row at the foot of the Ask Wati chats list.
 */

export type SettingsTab = "connectors" | "skills" | "memory" | "knowledge" | "conversations";

/** Wati AI features that work on conversations (the Conversations tab). */
export type InboxAiToggle =
  | "autoRating"
  | "manualRating"
  | "autoSummary"
  | "manualSummary"
  | "aiEditor"
  | "autoTranslate";
export type InboxAiSettings = Record<InboxAiToggle, boolean> & {
  brandTone: string;
  translateTo: string;
};

const INBOX_AI_DEFAULTS: InboxAiSettings = {
  autoRating: false,
  manualRating: false,
  autoSummary: false,
  manualSummary: true,
  aiEditor: true,
  autoTranslate: true,
  brandTone: "",
  translateTo: "English",
};

type Ctx = {
  /** Opens Settings > Wati AI on the given tab. */
  openSettings: (tab?: SettingsTab) => void;

  connectors: Connector[];
  /** Connectors that need the user to sign in again. */
  expiredCount: number;
  setEnabled: (id: string, enabled: boolean) => void;
  setToolPermission: (id: string, tool: string, permission: ToolPermission) => void;
  setKindPermission: (id: string, kind: ToolKind, permission: ToolPermission) => void;
  reconnect: (id: string) => void;
  disconnect: (id: string) => void;
  connectApp: (appId: string) => Connector | null;
  addCustomServer: (input: { name: string; description: string; url: string }) => Connector;
  updateCustomServer: (
    id: string,
    input: { name: string; description: string; url: string },
  ) => void;

  inboxAi: InboxAiSettings;
  setInboxAi: (patch: Partial<InboxAiSettings>) => void;
};

/** Wati AI settings live in global Settings, one page with a tab per area. */
export const watiAiSettingsHref = (tab: SettingsTab = "connectors") =>
  `/preview/settings?page=wati-ai&tab=${tab}`;

const SettingsCtx = createContext<Ctx | null>(null);

const hostOf = (url: string) => url.replace(/^https?:\/\//, "").split("/")[0];

export function AskWatiSettingsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [connectors, setConnectors] = useState<Connector[]>(SEED_CONNECTORS);
  const [inboxAi, setInboxAiState] = useState<InboxAiSettings>(INBOX_AI_DEFAULTS);
  const setInboxAi = useCallback(
    (patch: Partial<InboxAiSettings>) => setInboxAiState((s) => ({ ...s, ...patch })),
    [],
  );

  const openSettings = useCallback(
    (tab: SettingsTab = "connectors") => router.push(watiAiSettingsHref(tab)),
    [router],
  );

  const patch = useCallback((id: string, fn: (c: Connector) => Connector) => {
    setConnectors((list) => list.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  const setEnabled = useCallback(
    (id: string, enabled: boolean) => patch(id, (c) => ({ ...c, enabled })),
    [patch],
  );

  const setToolPermission = useCallback(
    (id: string, tool: string, permission: ToolPermission) =>
      patch(id, (c) => ({
        ...c,
        tools: c.tools.map((t) => (t.name === tool ? { ...t, permission } : t)),
      })),
    [patch],
  );

  const setKindPermission = useCallback(
    (id: string, kind: ToolKind, permission: ToolPermission) =>
      patch(id, (c) => ({
        ...c,
        tools: c.tools.map((t) => (t.kind === kind ? { ...t, permission } : t)),
      })),
    [patch],
  );

  const reconnect = useCallback(
    (id: string) => patch(id, (c) => ({ ...c, expired: false, enabled: true })),
    [patch],
  );

  const disconnect = useCallback((id: string) => {
    setConnectors((list) => list.filter((c) => c.id !== id || c.builtIn));
  }, []);

  const connectApp = useCallback(
    (appId: string) => {
      const app = POPULAR_APPS.find((a) => a.id === appId);
      if (!app || connectors.some((c) => c.appId === appId)) return null;
      const connector: Connector = {
        id: `${app.id}-${Date.now()}`,
        appId: app.id,
        logo: app.logo,
        name: app.name,
        summary: app.summary,
        host: app.host,
        description: app.description,
        tools: app.tools.map((t) => ({ ...t })),
        enabled: true,
        expired: false,
      };
      setConnectors((list) => [connector, ...list]);
      return connector;
    },
    [connectors],
  );

  const addCustomServer = useCallback(
    (input: { name: string; description: string; url: string }) => {
      const host = hostOf(input.url);
      const connector: Connector = {
        id: `custom-${Date.now()}`,
        name: input.name,
        summary: input.description || "Custom MCP server",
        host,
        description: `Wati AI read this server's description and tools from ${host} when you saved. Check each tool and set what Wati AI may do.`,
        tools: CUSTOM_SERVER_TOOLS.map((t) => ({ ...t })),
        enabled: true,
        expired: false,
        custom: true,
      };
      setConnectors((list) => [connector, ...list]);
      return connector;
    },
    [],
  );

  const updateCustomServer = useCallback(
    (id: string, input: { name: string; description: string; url: string }) =>
      patch(id, (c) => ({
        ...c,
        name: input.name,
        summary: input.description || "Custom MCP server",
        host: hostOf(input.url),
      })),
    [patch],
  );

  const value = useMemo<Ctx>(
    () => ({
      openSettings,
      connectors,
      expiredCount: connectors.filter((c) => c.expired).length,
      setEnabled,
      setToolPermission,
      setKindPermission,
      reconnect,
      disconnect,
      connectApp,
      addCustomServer,
      updateCustomServer,
      inboxAi,
      setInboxAi,
    }),
    [
      openSettings,
      connectors,
      setEnabled,
      setToolPermission,
      setKindPermission,
      reconnect,
      disconnect,
      connectApp,
      addCustomServer,
      updateCustomServer,
      inboxAi,
      setInboxAi,
    ],
  );

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

export function useAskWatiSettings(): Ctx {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error("useAskWatiSettings must be used within an AskWatiSettingsProvider");
  return ctx;
}
