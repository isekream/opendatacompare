"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  MapPin,
} from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import { DataMetaBar } from "@/components/dashboard/data-meta-bar";
import { SectionLabel } from "@/components/dashboard/section-label";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/compare", label: "Compare", icon: BarChart3 },
] as const;

type DashboardShellProps = {
  title: string;
  description?: string;
  meta?: { label: string; value: string }[];
  children: React.ReactNode;
};

export function DashboardShell({
  title,
  description,
  meta,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();

  const defaultMeta = [
    { label: "source", value: "Kanton Zürich OGD" },
    { label: "coverage", value: "Canton ZH · 161 communes" },
    { label: "year", value: "2024" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border/60 bg-sidebar md:flex">
        <div className="border-b border-border/60 px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-xs text-primary-foreground"
            >
              OD
            </span>
            <span className="text-sm">OpenDataCompare</span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          <SectionLabel className="px-2 pb-1">Workspace</SectionLabel>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0 opacity-70" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/60 p-4">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <p>Municipal finance dashboard for Swiss open government data.</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border/60 bg-background/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <div className="mb-2 flex gap-2 md:hidden">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-md px-2 py-1 text-xs font-medium",
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <SectionLabel>Dashboard</SectionLabel>
              <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-1 max-w-3xl text-xs text-muted-foreground sm:text-sm">
                  {description}
                </p>
              ) : null}
            </div>
            <ModeToggle />
          </div>
        </header>

        <main className="dashboard-canvas flex-1 px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </main>

        <DataMetaBar items={meta ?? defaultMeta} />
      </div>
    </div>
  );
}
