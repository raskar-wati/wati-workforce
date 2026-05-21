import { GlobalHeader } from "./components/GlobalHeader";
import { MainSidebar } from "./components/MainSidebar";
import { WorkforceMain } from "./components/WorkforceMain";

export default function Home() {
  return (
    <div className="flex h-screen flex-col bg-[var(--wati-surface-subtle)]">
      <GlobalHeader />
      <div className="flex flex-1 overflow-hidden">
        <MainSidebar />
        <main className="m-0 flex flex-1 overflow-hidden rounded-tl-xl border border-[var(--wati-border-default)] bg-white">
          <WorkforceMain />
        </main>
      </div>
    </div>
  );
}
