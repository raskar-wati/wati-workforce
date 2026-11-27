"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AskWatiDrawer } from "../../components/AskWatiDrawer";
import { MainSidebar } from "../../components/MainSidebar";
import { AskWatiSettings, WATI_AI_TABS } from "../../components/settings/AskWatiSettings";
import { ChatAssignmentSettings } from "../../components/settings/ChatAssignmentSettings";
import { SETTINGS_PAGES, SettingsNav } from "../../components/settings/SettingsNav";

/**
 * Global Settings: the account and workspace IA. Chat Assignment and Wati AI
 * are built; the other pages are placeholders. The open page lives in the URL
 * (?page=…) so other entry points can deep-link here.
 */
export default function SettingsPage() {
  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <MainSidebar />
      <main className="m-0 flex min-w-0 flex-1 overflow-hidden rounded-tl-xl rounded-tr-xl border border-[var(--wati-border-default)] bg-white">
        <Suspense>
          <SettingsBody />
        </Suspense>
      </main>
      <AskWatiDrawer />
    </div>
  );
}

function SettingsBody() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const current = params.get("page") ?? "my-profile";
  const watiAiTab = WATI_AI_TABS.find((t) => `wati-ai-${t.id}` === current)?.id;
  const label = SETTINGS_PAGES.find((p) => p.id === current)?.label ?? "";

  const go = (page: string) => router.replace(`${pathname}?page=${page}`, { scroll: false });

  return (
    <>
      <SettingsNav current={current} onSelect={(id) => go(id)} />
      <section className="min-w-0 flex-1 overflow-y-auto px-8 py-6">
        {/* Wati AI pages carry their own heading. */}
        {!watiAiTab && (
          <h1 className="text-[16px] font-medium tracking-[-0.096px] text-[#0a0a0a]">{label}</h1>
        )}
        {watiAiTab ? (
          <div className="flex">
            <AskWatiSettings tab={watiAiTab} />
          </div>
        ) : current === "chat-assignment" ? (
          <div className="mt-6">
            <ChatAssignmentSettings />
          </div>
        ) : (
          <div aria-hidden className="mt-6 flex max-w-[640px] flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-[var(--wati-border-default)] p-4">
                <div className="h-3 w-40 rounded bg-slate-100" />
                <div className="mt-2.5 h-2.5 w-72 max-w-full rounded bg-slate-100/70" />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
