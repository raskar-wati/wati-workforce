"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "wati.onboarding-seen.v1";

/**
 * Tracks whether the user has seen the conversational onboarding flow on
 * the Ask Wati surface. Set on completion, skip, or as an escape hatch when
 * a first-time user types a free-text message instead of tapping the lead
 * chip — once they've found their own way in, we don't intercept again.
 *
 * Resets when the user picks "First-time user" from the bottom-left chip
 * (that path clears all wati.* keys and reloads).
 */
export function useOnboardingSeen(): {
  seen: boolean;
  hydrated: boolean;
  markSeen: () => void;
} {
  const [seen, setSeen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;
      if (raw === "1") setSeen(true);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const markSeen = useCallback(() => {
    setSeen(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  return { seen, hydrated, markSeen };
}
