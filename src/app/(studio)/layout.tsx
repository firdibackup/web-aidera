import type { ReactNode } from "react";

import {
  ConnectionIndicator,
  MobileNav,
  PrototypeBanner,
  Sidebar,
} from "@/components/shell/navigation";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <PrototypeBanner />
        <header className="flex items-center justify-between gap-4 border-b border-line bg-surface px-4 py-3 lg:hidden">
          <span className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-[9px] bg-brand text-[0.75rem] font-bold text-brand-ink">
              A
            </span>
            <span className="text-sm font-semibold text-ink">AIDERA Content Studio</span>
          </span>
          <ConnectionIndicator />
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-6">{children}</div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
