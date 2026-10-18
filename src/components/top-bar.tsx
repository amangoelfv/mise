"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./brand";
import { Calendar, Sliders } from "./icons";

export function TopBar({ name, picture }: { name?: string; picture?: string }) {
  const pathname = usePathname();
  const initials = (name ?? "")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/app" aria-label="Mise home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/plan"
            className={`flex h-9 items-center gap-2 rounded-[10px] px-3 font-mono text-[12px] uppercase tracking-[0.12em] transition ${pathname === "/plan" ? "bg-ink-3 text-paper" : "text-paper/55 hover:text-paper"}`}
          >
            <Calendar size={16} />
            <span className="hidden sm:inline">Plan</span>
          </Link>
          <Link
            href="/settings"
            className={`flex h-9 items-center gap-2 rounded-[10px] px-3 font-mono text-[12px] uppercase tracking-[0.12em] transition ${pathname === "/settings" ? "bg-ink-3 text-paper" : "text-paper/55 hover:text-paper"}`}
          >
            <Sliders size={16} />
            <span className="hidden sm:inline">Settings</span>
          </Link>
          <Link href="/settings" aria-label="Account" className="size-8 overflow-hidden rounded-full border border-line">
            {picture ? (
              // eslint-disable-next-line @next/next/no-img-element -- tiny Google avatar, not worth image optimisation
              <img src={picture} alt="" referrerPolicy="no-referrer" className="size-full" />
            ) : (
              <span className="grid size-full place-items-center bg-ink-3 font-mono text-[11px] text-paper/70">{initials}</span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
