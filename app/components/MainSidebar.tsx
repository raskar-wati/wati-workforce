"use client";

import { useState } from "react";
import {
  BarChart3,
  BookUser,
  ChevronsLeft,
  ChevronsRight,
  LineChart,
  Mail,
  Megaphone,
  PanelsTopLeft,
  Plug,
  Puzzle,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  active?: boolean;
  children?: { label: string; active?: boolean }[];
};

const workspace: NavItem[] = [
  { label: "Conversations", icon: Mail },
  { label: "Contacts", icon: BookUser },
  { label: "Commerce", icon: ShoppingCart },
  { label: "Campaigns", icon: Megaphone },
];

const insights: NavItem[] = [
  { label: "Dashboards", icon: BarChart3 },
  { label: "Analytics", icon: LineChart },
];

const setup: NavItem[] = [
  { label: "Channels", icon: Puzzle },
  {
    label: "Connectors",
    icon: Plug,
    children: [{ label: "Integrations" }, { label: "API" }, { label: "Webhooks" }],
  },
  { label: "Users", icon: Users },
  { label: "Account", icon: Settings },
];

export function MainSidebar() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside
      data-collapsed={collapsed}
      className={`flex h-[calc(100vh-44px)] shrink-0 flex-col gap-px overflow-hidden bg-[var(--wati-surface-subtle)] py-2 transition-[width] duration-200 ease-out ${
        collapsed ? "w-[60px] px-1" : "w-[210px] px-1"
      }`}
    >
      {/* Scrollable nav region */}
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* Workforce (active product) */}
        <Section collapsed={collapsed}>
          <NavRow
            icon={PanelsTopLeft}
            label="WorkForce"
            active
            collapsed={collapsed}
          />
        </Section>
        <Divider collapsed={collapsed} />

        {/* Workspace */}
        <SectionHeading collapsed={collapsed}>Workspace</SectionHeading>
        <Section collapsed={collapsed}>
          {workspace.map((item) => (
            <NavRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
            />
          ))}
        </Section>
        <Divider collapsed={collapsed} />

        {/* Insights */}
        <SectionHeading collapsed={collapsed}>Insights</SectionHeading>
        <Section collapsed={collapsed}>
          {insights.map((item) => (
            <NavRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
            />
          ))}
        </Section>
        <Divider collapsed={collapsed} />

        {/* Setup */}
        <SectionHeading collapsed={collapsed}>Setup</SectionHeading>
        <Section collapsed={collapsed}>
          {setup.map((item) =>
            item.children ? (
              <div key={item.label}>
                <NavRow
                  icon={item.icon}
                  label={item.label}
                  collapsed={collapsed}
                />
                {!collapsed && (
                  <div className="ml-[22px] border-l border-[var(--wati-tree-border)] py-0.5 pl-1.5">
                    {item.children.map((child) => (
                      <button
                        key={child.label}
                        type="button"
                        className="block w-full rounded-md px-4 py-1 text-left text-sm font-medium text-[var(--wati-text-subtitle)] hover:bg-[var(--wati-hover-bg)]"
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavRow
                key={item.label}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
              />
            )
          )}
        </Section>
        <Divider collapsed={collapsed} />
      </div>

      {/* Collapse toggle pinned at the bottom */}
      <div className="pt-1.5">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-[var(--wati-text-body)] hover:bg-[var(--wati-hover-bg)]"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!collapsed}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[var(--wati-icon-default)]">
            {collapsed ? (
              <ChevronsRight size={18} strokeWidth={1.75} />
            ) : (
              <ChevronsLeft size={18} strokeWidth={1.75} />
            )}
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function Section({
  children,
  collapsed,
}: {
  children: React.ReactNode;
  collapsed: boolean;
}) {
  return (
    <div
      className={`flex w-full flex-col ${collapsed ? "items-center" : "items-stretch"}`}
    >
      {children}
    </div>
  );
}

function SectionHeading({
  children,
  collapsed,
}: {
  children: React.ReactNode;
  collapsed: boolean;
}) {
  if (collapsed) return <div className="h-2" aria-hidden />;
  return (
    <div className="flex items-center px-2 pb-1 pt-2">
      <span className="text-[12px] font-semibold uppercase tracking-[1px] text-[var(--wati-text-caption)]">
        {children}
      </span>
    </div>
  );
}

function Divider({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={`w-full py-2 ${collapsed ? "flex justify-center" : ""}`}
      aria-hidden
    >
      <div
        className={`h-px bg-[var(--wati-divider-light)] ${
          collapsed ? "w-8" : "w-full"
        }`}
      />
    </div>
  );
}

function NavRow({
  icon: Icon,
  label,
  active,
  collapsed,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  active?: boolean;
  collapsed: boolean;
}) {
  return (
    <button
      type="button"
      title={collapsed ? label : undefined}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-[var(--wati-hover-bg)] ${
        active
          ? "text-[var(--wati-text-primary)]"
          : "text-[var(--wati-text-body)]"
      } ${collapsed ? "justify-center" : ""}`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center ${
          active
            ? "text-[var(--wati-text-primary)]"
            : "text-[var(--wati-icon-default)]"
        }`}
      >
        <Icon size={18} strokeWidth={1.75} />
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}
