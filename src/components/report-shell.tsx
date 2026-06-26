"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModeToggle } from "@/components/mode-toggle";
import { DataMetaBar } from "@/components/dashboard/data-meta-bar";
import { cn } from "@/lib/utils";
import { getSpendingDataset } from "@/lib/spending/ch-spending";

type ReportShellProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
};

const dataset = getSpendingDataset();

export function ReportShell({ title, description, children }: ReportShellProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-xs text-primary-foreground"
            >
              OD
            </span>
            <span className="text-sm">OpenDataCompare</span>
          </Link>
          <ModeToggle />
        </div>
      </header>

      <main className="dashboard-canvas flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          {!isHome && title ? (
            <div className="mb-8">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Spending report
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
          ) : null}
          {children}
        </div>
      </main>

      <DataMetaBar
        items={[
          { label: "source", value: dataset.source.name },
          { label: "year", value: String(dataset.year) },
          { label: "coverage", value: dataset.coverage.scope },
        ]}
      />
    </div>
  );
}

export function ReportPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/60 bg-card/80 p-5 sm:p-6",
        className,
      )}
    >
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
