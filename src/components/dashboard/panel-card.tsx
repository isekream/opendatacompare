import { cn } from "@/lib/utils";

type PanelCardProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function PanelCard({
  title,
  description,
  action,
  children,
  className,
}: PanelCardProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-card/30 ring-1 ring-foreground/[0.04]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/50 px-4 py-3">
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
