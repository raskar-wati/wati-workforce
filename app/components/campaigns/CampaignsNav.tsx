import { ChevronDown, ChevronUp, PieChart, Plus } from "lucide-react";
import { TemplateMessagesIcon } from "../icons/TemplateMessagesIcon";

/**
 * The Campaigns module's own nav. Static in this prototype: it shows where
 * the calendar sits (Campaigns Overview) without the other pages.
 */
export function CampaignsNav() {
  return (
    <nav aria-label="Campaigns" className="flex w-[232px] shrink-0 flex-col gap-4 border-r border-wati-border px-4 py-4">
      <p className="px-1 text-[16px] font-semibold text-[#0a0a0a]">Campaigns</p>
      <span className="flex items-center justify-center gap-1.5 rounded-lg bg-wati-green py-2.5 text-[13px] font-medium text-white">
        <Plus size={15} />
        Create New Campaign
      </span>
      <div className="flex flex-col gap-1">
        <NavGroup icon={<PieChart size={15} />} label="Campaigns" open />
        <div className="ml-3 flex flex-col gap-0.5 border-l border-wati-border pl-3">
          <NavLeaf active>Campaigns Overview</NavLeaf>
          <NavLeaf>Automated Template Sends</NavLeaf>
          <NavLeaf>SMS</NavLeaf>
        </div>
        <NavGroup icon={<TemplateMessagesIcon size={16} />} label="Template Messages" />
      </div>
    </nav>
  );
}

function NavGroup({ icon, label, open = false }: { icon: React.ReactNode; label: string; open?: boolean }) {
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <span className="flex items-center gap-2.5 px-1 py-2 text-[14px] font-medium text-[#0a0a0a]">
      <span className="text-black/60">{icon}</span>
      {label}
      <Chevron size={14} className="ml-auto text-black/40" />
    </span>
  );
}

function NavLeaf({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className={`rounded-md px-2.5 py-2 text-[13px] ${
        active ? "bg-black/[0.05] font-medium text-[#0a0a0a]" : "text-black/65"
      }`}
    >
      {children}
    </span>
  );
}
