import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  badge?: string;
  className?: string;
};

export function SiteHeader({ badge, className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground"
          >
            OD
          </span>
          OpenDataCompare
        </Link>
        <div className="flex items-center gap-2">
          {badge ? <Badge variant="secondary">{badge}</Badge> : null}
          <ModeToggle />
          {!badge ? (
            <Link
              href="/compare"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Compare
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
