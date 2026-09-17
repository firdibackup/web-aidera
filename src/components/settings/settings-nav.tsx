"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

interface SettingsTab {
  href: Route;
  label: string;
}

const settingsTabs: SettingsTab[] = [
  { href: "/settings", label: "Umum" },
  { href: "/settings/workflow", label: "Workflow" },
  { href: "/settings/agents", label: "Agents" },
  { href: "/settings/instructions", label: "Instructions" },
  { href: "/settings/integrations", label: "Integrasi" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="scroll-x -mx-4 px-4 md:mx-0 md:px-0">
      <nav aria-label="Navigasi pengaturan" className="flex min-w-max gap-1 border-b border-line">
        {settingsTabs.map((tab) => {
          const active = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center whitespace-nowrap border-b-2 px-3 text-[0.8125rem] font-medium transition-colors duration-150 pointer-coarse:min-h-11",
                active
                  ? "border-brand text-brand-strong"
                  : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
