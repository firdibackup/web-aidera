"use client";

import {
  Activity,
  CalendarDays,
  Columns3,
  FlaskConical,
  Gauge,
  Library,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";

import { Badge } from "@/components/ui/badge";
import { PROTOTYPE_NOTICE } from "@/lib/api/contracts";
import { useConnectionState } from "@/lib/query/data-source";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: Route;
  label: string;
  snippet: string;
  icon: ComponentType<{ className?: string }>;
  primary: boolean;
}

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Ikhtisar",
    snippet: "Keputusan dan kesehatan produksi",
    icon: Gauge,
    primary: true,
  },
  {
    href: "/agents",
    label: "Agents",
    snippet: "Tujuh spesialis AIDERA",
    icon: Sparkles,
    primary: true,
  },
  {
    href: "/plans",
    label: "Plans",
    snippet: "Proposal CEO menunggu ACC",
    icon: FlaskConical,
    primary: false,
  },
  {
    href: "/content/board",
    label: "Board",
    snippet: "15 tahap produksi",
    icon: Columns3,
    primary: true,
  },
  {
    href: "/content/calendar",
    label: "Kalender",
    snippet: "Ritme publikasi",
    icon: CalendarDays,
    primary: true,
  },
  {
    href: "/content",
    label: "Content Library",
    snippet: "Ide, draft, dan paket final",
    icon: Library,
    primary: false,
  },
  {
    href: "/approvals",
    label: "Approval",
    snippet: "Keputusan yang menunggu",
    icon: ShieldCheck,
    primary: false,
  },
  {
    href: "/activity",
    label: "Aktivitas",
    snippet: "Kejadian nyata dari Bridge",
    icon: Activity,
    primary: false,
  },
  {
    href: "/settings",
    label: "Pengaturan",
    snippet: "Gate, automation, dan integrasi",
    icon: Settings,
    primary: false,
  },
];

const primaryNavItems = navItems.filter((item) => item.primary);
const secondaryNavItems = navItems.filter((item) => !item.primary);

const siblingPrefixes = ["/content/board", "/content/calendar"];

function useIsActive(href: string): (candidate: string) => boolean {
  return (candidate: string) => {
    if (href === candidate) {
      return true;
    }

    if (candidate === "/content" && siblingPrefixes.some((prefix) => href.startsWith(prefix))) {
      return false;
    }

    return href.startsWith(`${candidate}/`);
  };
}

export function Sidebar() {
  const pathname = usePathname();
  const isActive = useIsActive(pathname);

  return (
    <nav
      aria-label="Navigasi utama"
      className="hidden w-[var(--shell-sidebar)] shrink-0 flex-col gap-6 border-r border-line bg-surface px-4 py-6 lg:flex"
    >
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
        <span className="grid size-8 place-items-center rounded-[10px] bg-brand text-sm font-bold text-brand-ink">
          A
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-ink">AIDERA</span>
          <span className="text-[0.6875rem] text-ink-faint">Content Studio</span>
        </span>
      </Link>

      <div className="flex flex-col gap-5">
        <NavGroup label="Produksi" items={primaryNavItems} isActive={isActive} />
        <NavGroup label="Kontrol" items={secondaryNavItems} isActive={isActive} />
      </div>

      <ConnectionCard />
    </nav>
  );
}

function NavGroup({
  label,
  items,
  isActive,
}: {
  label: string;
  items: NavItem[];
  isActive: (candidate: string) => boolean;
}) {
  return (
    <div>
      <p className="px-3 text-[0.625rem] font-semibold tracking-[0.08em] text-ink-faint uppercase">
        {label}
      </p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-start gap-3 rounded-[var(--radius-control)] px-3 py-2.5 transition-colors duration-150 ease-[var(--ease-out-quint)]",
                  active
                    ? "bg-brand-soft text-brand-strong"
                    : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
                )}
              >
                <Icon aria-hidden className="mt-0.5 size-[18px]" />
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-[0.6875rem] text-ink-faint">{item.snippet}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const isActive = useIsActive(pathname);
  const [sheetState, setSheetState] = useState({ open: false, pathname });
  const sheetOpen = sheetState.open && sheetState.pathname === pathname;
  const setSheetOpen = (open: boolean) => setSheetState({ open, pathname });
  const secondaryActive = secondaryNavItems.some((item) => isActive(item.href));

  return (
    <>
      {sheetOpen ? (
        <div className="fixed inset-0 z-40 flex items-end lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-ink/25"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu lainnya"
            className="relative w-full rounded-t-[var(--radius-panel)] border-t border-line bg-surface px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4"
          >
            <p className="text-sm font-semibold text-ink">Menu lainnya</p>
            <ul className="mt-3 flex flex-col gap-1">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm font-medium",
                        isActive(item.href)
                          ? "bg-brand-soft text-brand-strong"
                          : "text-ink-muted hover:bg-surface-sunken",
                      )}
                    >
                      <Icon aria-hidden className="size-[18px]" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Navigasi utama mobile"
        className="sticky bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {primaryNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6875rem] font-medium transition-colors",
                active ? "text-brand-strong" : "text-ink-faint",
              )}
            >
              <Icon aria-hidden className="size-[18px]" />
              {item.label}
            </Link>
          );
        })}

        <button
          type="button"
          aria-expanded={sheetOpen}
          aria-label="Menu lainnya"
          onClick={() => setSheetOpen(!sheetOpen)}
          className={cn(
            "flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6875rem] font-medium transition-colors",
            secondaryActive || sheetOpen ? "text-brand-strong" : "text-ink-faint",
          )}
        >
          <Menu aria-hidden className="size-[18px]" />
          Lainnya
        </button>
      </nav>
    </>
  );
}

export function ConnectionIndicator() {
  const state = useConnectionState();

  if (state === "offline") {
    return (
      <Badge tone="danger" icon={<WifiOff aria-hidden className="size-3" />}>
        Offline
      </Badge>
    );
  }

  if (state === "live") {
    return <Badge tone="success">Live</Badge>;
  }

  return <Badge tone="prototype">Prototype</Badge>;
}

function ConnectionCard() {
  const state = useConnectionState();

  return (
    <div className="mt-auto rounded-[var(--radius-panel)] border border-line bg-surface-sunken px-3 py-3">
      <p className="text-[0.6875rem] font-semibold tracking-wide text-ink-muted">Koneksi data</p>
      <div className="mt-2">
        <ConnectionIndicator />
      </div>
      <p className="mt-2 text-[0.6875rem] leading-relaxed text-ink-faint">
        {state === "offline"
          ? "Perubahan tidak dapat dikirim sampai koneksi kembali."
          : state === "live"
            ? "Terhubung ke Bridge."
            : PROTOTYPE_NOTICE}
      </p>
    </div>
  );
}

export function PrototypeBanner() {
  const state = useConnectionState();

  if (state === "live") {
    return null;
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-prototype/30 bg-prototype-soft px-4 py-2 text-[0.75rem] text-prototype md:px-8"
    >
      <span className="font-semibold">Prototype Data</span>
      <span>{PROTOTYPE_NOTICE}</span>
      {state === "offline" ? <span className="font-medium">· Browser sedang offline</span> : null}
    </div>
  );
}
