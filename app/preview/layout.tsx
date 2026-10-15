import { GlobalHeader } from "../components/GlobalHeader";

/**
 * Shared shell for every preview module. The header lives here rather than
 * in each page so it stays mounted across navigation — that's what lets the
 * Wati AI bar glide between its centred spot and the Ask Wati chat input
 * instead of jumping on every route change.
 */
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-[var(--wati-surface-subtle)]">
      <GlobalHeader />
      {children}
    </div>
  );
}
