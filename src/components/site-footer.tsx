import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} OpenDataCompare</p>
        <p>Official data. Clear comparisons. No black boxes.</p>
      </div>
    </footer>
  );
}

export function SiteSectionSeparator() {
  return <Separator className="max-w-5xl mx-auto" />;
}
