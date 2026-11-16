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
import {
  CUSTOM_SERVER_TOOLS,
  POPULAR_APPS,
  SEED_CONNECTORS,
  type Connector,
  type ToolKind,
  type ToolPermission,
} from "./connectors-data";

/**
 * Ask Wati settings: Connectors (built), Skills and Memory (placeholders).
 *
 * Also holds where the settings entry point lives. That placement is still
 * being explored, so the Simulate menu switches between the candidates and
 * every surface asks `placement` before showing its entry.
 */

export type SettingsTab = "connectors" | "skills" | "memory";

export type SettingsPlacement =
  | "chat-header"
  | "composer"
  | "thread-panel"
  | "nav-wati-ai"
  | "nav-connectors";

export const PLACEMENT_OPTIONS: {
  id: SettingsPlacement;
  label: string;
  hint: string;
}[] = [
  {
    id: "chat-header",
    label: "Gear in the chat header",
    hint: "Top right of Ask Wati, opens a settings pop-up",
  },
  {
    id: "composer",
    label: "Composer + menu",
    hint: "Connectors with quick switches, next to files",
  },
  {
    id: "thread-panel",
    label: "Foot of the chats list",
    hint: "Bottom of the Ask Wati side panel",
  },
  // Parked: the side-nav placements ("nav-wati-ai", "nav-connectors") still
  // work in MainSidebar but are hidden from the simulator for now.
];

export const AI_SETTINGS_PAGE = "/preview/ai-settings";

const PLACEMENT_KEY = "wati.askWatiSettings.placement";

type Ctx = {
  placement: SettingsPlacement;
  setPlacement: (p: SettingsPlacement) => void;

  /** Settings pop-up, for the placements that use one. */
  dialogOpen: boolean;
  dialogTab: SettingsTab;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;

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
};

const SettingsCtx = createContext<Ctx | null>(null);

const hostOf = (url: string) => url.replace(/^https?:\/\//, "").split("/")[0];

export function AskWatiSettingsProvider({ children }: { children: ReactNode }) {
  const [placement, setPlacementState] = useState<SettingsPlacement>("chat-header");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<SettingsTab>("connectors");
  const [connectors, setConnectors] = useState<Connector[]>(SEED_CONNECTORS);

  // The chosen placement survives a reload; storage may be blocked.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PLACEMENT_KEY);
      if (saved && PLACEMENT_OPTIONS.some((o) => o.id === saved)) {
        setPlacementState(saved as SettingsPlacement);
      }
    } catch {}
  }, []);

  const setPlacement = useCallback((p: SettingsPlacement) => {
    setPlacementState(p);
    setDialogOpen(false);
    try {
      window.localStorage.setItem(PLACEMENT_KEY, p);
    } catch {}
  }, []);

  const openSettings = useCallback((tab: SettingsTab = "connectors") => {
    setDialogTab(tab);
    setDialogOpen(true);
  }, []);
  const closeSettings = useCallback(() => setDialogOpen(false), []);

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
      placement,
      setPlacement,
      dialogOpen,
      dialogTab,
      openSettings,
      closeSettings,
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
    }),
    [
      placement,
      setPlacement,
      dialogOpen,
      dialogTab,
      openSettings,
      closeSettings,
      connectors,
      setEnabled,
      setToolPermission,
      setKindPermission,
      reconnect,
      disconnect,
      connectApp,
      addCustomServer,
      updateCustomServer,
    ],
  );

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

export function useAskWatiSettings(): Ctx {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error("useAskWatiSettings must be used within an AskWatiSettingsProvider");
  return ctx;
}
