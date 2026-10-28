"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShellLayout } from "../lib/shell-layout";
import { ASK_WATI_PAGE } from "./AskWatiDrawer";
import { navIconMask, type NavIconName } from "./icons/nav-icons";

/**
 * Primary navigation, borrowed from the Wati IA reference (preset A, "One
 * Wati AI"). Expanded it's a 210px labelled list whose groups open and close
 * in place; collapsed it's a 44px icon rail where leaves show a tooltip and
 * groups show a flyout of their sub-items on hover/focus.
 */

type NavChild = { id: string; label: string; href?: string };

type NavItem = {
  id: string;
  label: string;
  icon: NavIconName;
  href?: string;
  children?: NavChild[];
};

const NAV: NavItem[] = [
  { id: "campaigns", label: "Campaigns", icon: "campaigns", href: "/preview/campaigns" },
  { id: "inbox", label: "Inbox", icon: "inbox", href: "/preview" },
  { id: "contacts", label: "Contacts", icon: "contacts", href: "/preview/contacts" },
  { id: "automations", label: "Automations", icon: "automations" },
  { id: "commerce", label: "Commerce", icon: "commerce", href: "/preview/shopify" },
  { id: "ads", label: "Ads", icon: "ads" },
  { id: "analytics", label: "Analytics", icon: "analytics", href: "/preview/analytics" },
  {
    id: "channels",
    label: "Channels",
    icon: "channels",
    children: [
      { id: "channels-manage", label: "Overview" },
      { id: "growth-widget", label: "Growth Widget" },
    ],
  },
  {
    id: "wati-ai",
    label: "Wati AI",
    icon: "sparkle",
    children: [
      { id: "ask-wati", label: "Ask Wati", href: ASK_WATI_PAGE },
      { id: "talk-to-wati", label: "On WhatsApp" },
      { id: "mcp", label: "In AI tools (MCP)" },
    ],
  },
  {
    id: "connectors",
    label: "Connectors",
    icon: "connectors",
    children: [
      { id: "integrations", label: "Integrations" },
      { id: "api", label: "API" },
      { id: "webhooks", label: "Webhooks" },
    ],
  },
  { id: "settings", label: "Settings", icon: "settings" },
];

const COLLAPSED_KEY = "wati.sidebar.collapsed";
/** Below --wati-bp-md the rail is forced collapsed; the user's choice returns when it widens. */
const NARROW_QUERY = "(max-width: 959px)";
const FLYOUT_HIDE_DELAY = 140;
/** Keep in step with the aside's w-[210px] / w-[44px] (Tailwind needs literal classes). */
const NAV_WIDTH = 210;
const RAIL_WIDTH = 44;

type Flyout =
  | { kind: "tip"; label: string; top: number; left: number }
  | { kind: "menu"; item: NavItem; top: number; left: number };

export function MainSidebar() {
  const pathname = usePathname();
  const [userCollapsed, setUserCollapsed] = useState(false);
  const [narrow, setNarrow] = useState(false);
  // Width animates only after the persisted state is applied, so a remount on
  // route change doesn't replay the 210→44 slide.
  const [ready, setReady] = useState(false);
  // Channels starts open (as in the reference); so does whichever group
  // holds the current page.
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = { channels: true };
    for (const item of NAV) {
      if (item.children?.some((c) => c.href === pathname)) initial[item.id] = true;
    }
    return initial;
  });
  const [flyout, setFlyout] = useState<Flyout | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const collapsed = narrow || userCollapsed;

  useLayoutEffect(() => {
    try {
      setUserCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === "true");
    } catch {}
    const mq = window.matchMedia(NARROW_QUERY);
    setNarrow(mq.matches);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    setReady(true);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Report the rail's width so the header can place the Wati AI bar over
  // the content area.
  const { setNavWidth } = useShellLayout();
  useLayoutEffect(() => {
    setNavWidth(collapsed ? RAIL_WIDTH : NAV_WIDTH);
  }, [collapsed, setNavWidth]);

  useEffect(() => {
    if (!collapsed) setFlyout(null);
  }, [collapsed]);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setUserCollapsed(next);
    try {
      window.localStorage.setItem(COLLAPSED_KEY, String(next));
    } catch {}
  };

  const cancelHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };
  const scheduleHide = () => {
    cancelHide();
    hideTimer.current = setTimeout(() => setFlyout(null), FLYOUT_HIDE_DELAY);
  };
  const showFlyout = (el: HTMLElement, item: NavItem | { label: string }) => {
    if (!collapsed) return;
    cancelHide();
    const r = el.getBoundingClientRect();
    const left = r.right + 8;
    setFlyout(
      "children" in item && item.children
        ? { kind: "menu", item, top: r.top, left }
        : { kind: "tip", label: item.label, top: r.top + r.height / 2, left },
    );
  };

  const isActive = (item: NavItem) => !!item.href && pathname === item.href;
  const isChildActive = (child: NavChild) => !!child.href && pathname === child.href;

  return (
    <aside
      data-collapsed={collapsed}
      aria-label="Primary"
      onClick={(e) => {
        // Empty rail space toggles, as in the reference shell.
        if (!(e.target as HTMLElement).closest("a, button")) toggleCollapsed();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setFlyout(null);
      }}
      className={`flex h-[calc(100vh-44px)] shrink-0 cursor-pointer flex-col overflow-hidden bg-[var(--wati-surface-subtle)] px-1 pb-3 pt-1 ${
        ready ? "transition-[width] duration-[160ms] ease-[ease]" : ""
      } ${collapsed ? "w-[44px]" : "w-[210px]"}`}
    >
      <nav className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {NAV.map((item) => {
          const hasKids = !!item.children?.length;
          const isOpen = hasKids && !!open[item.id];
          return (
            <div key={item.id} className="flex shrink-0 flex-col">
              <NavRow
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={isActive(item)}
                collapsed={collapsed}
                expanded={hasKids ? isOpen : undefined}
                onClick={
                  hasKids
                    ? () => {
                        if (collapsed) return;
                        setOpen((o) => ({ ...o, [item.id]: !isOpen }));
                      }
                    : undefined
                }
                onShowFlyout={(el) => showFlyout(el, item)}
                onHideFlyout={scheduleHide}
              />
              {hasKids && isOpen && !collapsed &&
                item.children!.map((child) => (
                  <div
                    key={child.id}
                    className="ml-[15px] shrink-0 border-l-2 border-[var(--wati-border-default)]"
                  >
                    <SubRow
                      label={child.label}
                      href={child.href}
                      active={isChildActive(child)}
                    />
                  </div>
                ))}
            </div>
          );
        })}
      </nav>

      <NavRow
        icon="collapse"
        label="Collapse"
        collapsed={collapsed}
        mirrored={collapsed}
        ariaLabel={collapsed ? "Expand navigation" : "Collapse navigation"}
        ariaPressed={collapsed}
        onClick={toggleCollapsed}
        onShowFlyout={(el) => showFlyout(el, { label: "Expand" })}
        onHideFlyout={scheduleHide}
      />

      {flyout && collapsed && (
        <NavFlyout
          flyout={flyout}
          isChildActive={isChildActive}
          onPick={() => setFlyout(null)}
          onEnter={cancelHide}
          onLeave={scheduleHide}
        />
      )}
    </aside>
  );
}

function Glyph({
  icon,
  tone,
  size = 20,
  className = "",
}: {
  icon: NavIconName;
  tone: "dark" | "light";
  size?: number;
  className?: string;
}) {
  const mask = navIconMask(icon);
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: tone === "dark" ? "var(--wati-icons-dark)" : "var(--wati-icons-light)",
        mask,
        WebkitMask: mask,
      }}
    />
  );
}

function NavRow({
  icon,
  label,
  href,
  active,
  collapsed,
  expanded,
  mirrored,
  ariaLabel,
  ariaPressed,
  onClick,
  onShowFlyout,
  onHideFlyout,
}: {
  icon: NavIconName;
  label: string;
  href?: string;
  active?: boolean;
  collapsed: boolean;
  /** Set for group rows: drives the chevron and aria-expanded. */
  expanded?: boolean;
  mirrored?: boolean;
  ariaLabel?: string;
  ariaPressed?: boolean;
  onClick?: () => void;
  onShowFlyout: (el: HTMLElement) => void;
  onHideFlyout: () => void;
}) {
  const className = `mt-2 flex h-10 w-full shrink-0 items-center gap-[11px] whitespace-nowrap rounded-lg px-[9px] text-left text-sm text-[var(--wati-text-body)] hover:bg-[var(--wati-surface-emphasis)] hover:text-[var(--wati-text-title)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wati-green)] ${
    active ? "bg-[var(--wati-surface-emphasis)] font-semibold" : "font-medium"
  } ${collapsed ? "justify-center px-0" : ""}`;

  const flyoutHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => onShowFlyout(e.currentTarget),
    onMouseLeave: onHideFlyout,
    onFocus: (e: React.FocusEvent<HTMLElement>) => onShowFlyout(e.currentTarget),
    onBlur: onHideFlyout,
  };

  const body = (
    <>
      <Glyph icon={icon} tone="dark" className={mirrored ? "-scale-x-100" : ""} />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {expanded !== undefined && (
            <Glyph
              icon="chevronDown"
              tone="light"
              size={16}
              className={`mr-[3px] transition-transform duration-150 ease-[ease] ${
                expanded ? "rotate-180" : ""
              }`}
            />
          )}
        </>
      )}
    </>
  );

  const accessibleName = ariaLabel ?? (collapsed ? label : undefined);

  if (href) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        aria-label={accessibleName}
        className={className}
        {...flyoutHandlers}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-expanded={collapsed ? undefined : expanded}
      aria-pressed={ariaPressed}
      aria-label={accessibleName}
      className={className}
      {...flyoutHandlers}
    >
      {body}
    </button>
  );
}

function SubRow({
  label,
  href,
  active,
}: {
  label: string;
  href?: string;
  active: boolean;
}) {
  const className = `ml-0.5 flex h-10 w-[calc(100%-2px)] items-center whitespace-nowrap rounded-lg pl-6 pr-2.5 text-left text-sm text-[var(--wati-text-body)] hover:bg-[var(--wati-surface-emphasis)] ${
    active ? "bg-[var(--wati-surface-emphasis)] font-semibold" : "font-medium"
  }`;
  const body = <span className="min-w-0 flex-1 truncate">{label}</span>;
  return href ? (
    <Link href={href} aria-current={active ? "page" : undefined} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" className={className}>
      {body}
    </button>
  );
}

/** Collapsed-rail hover surface: a tooltip for leaves, a sub-item menu for groups. */
function NavFlyout({
  flyout,
  isChildActive,
  onPick,
  onEnter,
  onLeave,
}: {
  flyout: Flyout;
  isChildActive: (child: NavChild) => boolean;
  onPick: () => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  if (flyout.kind === "tip") {
    return (
      <div
        role="tooltip"
        className="pointer-events-none fixed z-[200] -translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--wati-tooltip-bg)] px-2.5 py-[7px] text-[13px] font-medium leading-none text-white shadow-md"
        style={{ top: flyout.top, left: flyout.left }}
      >
        {flyout.label}
      </div>
    );
  }
  return (
    <div
      role="menu"
      aria-label={flyout.item.label}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="fixed z-[200] min-w-[184px] cursor-default rounded-lg border border-[var(--wati-border-default)] bg-white p-1.5 shadow-lg"
      style={{ top: flyout.top, left: flyout.left }}
    >
      <div className="px-2 py-1.5 text-xs font-bold uppercase tracking-[1px] text-[var(--wati-text-caption)]">
        {flyout.item.label}
      </div>
      {flyout.item.children!.map((child) => {
        const className = `flex h-8 w-full items-center rounded px-2 text-left text-[13px] text-[var(--wati-text-subtitle)] hover:bg-[var(--wati-surface-emphasis)] ${
          isChildActive(child) ? "font-semibold text-[var(--wati-text-title)]" : ""
        }`;
        return child.href ? (
          <Link
            key={child.id}
            href={child.href}
            role="menuitem"
            aria-current={isChildActive(child) ? "page" : undefined}
            onClick={onPick}
            className={className}
          >
            {child.label}
          </Link>
        ) : (
          <button key={child.id} type="button" role="menuitem" onClick={onPick} className={className}>
            {child.label}
          </button>
        );
      })}
    </div>
  );
}
