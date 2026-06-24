"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  Megaphone,
  MousePointer2,
  PieChart,
  Plug,
  Settings,
  ShoppingCart,
  Users,
  Workflow,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  href?: string;
  children?: { label: string }[];
};

const nav: NavItem[] = [
  { label: "Campaigns", icon: Megaphone },
  { label: "Inbox", icon: Inbox, href: "/preview" },
  { label: "Contacts", icon: Users, href: "/preview/contacts" },
  { label: "Automations", icon: Workflow },
  { label: "Commerce", icon: ShoppingCart, href: "/preview/shopify" },
  { label: "Ads", icon: MousePointer2 },
  { label: "Analytics", icon: PieChart, href: "/preview/analytics" },
  {
    label: "Connectors",
    icon: Plug,
    children: [
      { label: "Integrations" },
      { label: "API Docs" },
      { label: "Webhooks" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "Channels" },
      { label: "User Management" },
      { label: "Account Details" },
    ],
  },
];

const COLLAPSED_KEY = "wati.sidebar.collapsed";

export function MainSidebar() {
  // Lazy initializer reads the persisted value synchronously on mount so the
  // sidebar doesn't flash from collapsed→expanded on every page navigation
  // (it remounts inside each page route).
  const [collapsed, setCollapsed] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COLLAPSED_KEY);
      if (raw === "false") setCollapsed(false);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    } catch {}
  }, [collapsed, hydrated]);

  return (
    <aside
      data-collapsed={collapsed}
      className={`flex h-[calc(100vh-44px)] shrink-0 flex-col gap-px overflow-hidden bg-[var(--wati-surface-subtle)] py-2 transition-[width] duration-200 ease-out ${
        collapsed ? "w-[60px] px-1" : "w-[210px] px-1"
      }`}
    >
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden pt-1">
        <div
          className={`flex w-full flex-col ${collapsed ? "items-center" : "items-stretch"}`}
        >
          {nav.map((item) =>
            item.children ? (
              <ExpandableRow
                key={item.label}
                item={item}
                collapsed={collapsed}
              />
            ) : (
              <NavRow
                key={item.label}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={item.href ? pathname === item.href : false}
                collapsed={collapsed}
              />
            ),
          )}
        </div>
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

function ExpandableRow({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <NavRow
        icon={item.icon}
        label={item.label}
        collapsed={collapsed}
        onClick={() => setOpen((v) => !v)}
      />
      {!collapsed && open && item.children && (
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
  );
}

function NavRow({
  icon: Icon,
  label,
  active,
  href,
  collapsed,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  active?: boolean;
  href?: string;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const className = `flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-[var(--wati-hover-bg)] ${
    active
      ? "bg-[var(--wati-active-bg)] text-[var(--wati-text-primary)]"
      : "text-[var(--wati-text-body)]"
  } ${collapsed ? "justify-center" : ""}`;

  const body = (
    <>
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
    </>
  );

  if (href) {
    return (
      <Link href={href} title={collapsed ? label : undefined} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={className}
    >
      {body}
    </button>
  );
}
