"use client";

import { useEffect, useState } from "react";
import { useAskWatiSettings, type SettingsTab } from "../../lib/ask-wati-settings";
import { AskWatiSettings } from "./AskWatiSettings";
import { BetaBadge } from "./BetaBadge";
import { SettingsModal } from "./SettingsModal";

/** Wati AI settings pop-up, opened from inside Ask Wati. */
export function AskWatiSettingsDialog() {
  const { dialogOpen, dialogTab, closeSettings } = useAskWatiSettings();
  const [tab, setTab] = useState<SettingsTab>(dialogTab);

  // Each opening starts on the tab the entry point asked for.
  useEffect(() => {
    if (dialogOpen) setTab(dialogTab);
  }, [dialogOpen, dialogTab]);

  return (
    <SettingsModal
      open={dialogOpen}
      onClose={closeSettings}
      title="Wati AI settings"
      badge={<BetaBadge />}
    >
      <AskWatiSettings tab={tab} onTabChange={setTab} />
    </SettingsModal>
  );
}
