type DataMetaBarProps = {
  items: { label: string; value: string }[];
};

export function DataMetaBar({ items }: DataMetaBarProps) {
  return (
    <div className="border-t border-border/60 bg-muted/20 px-6 py-2.5">
      <dl className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-muted-foreground">
        {items.map((item) => (
          <div key={item.label} className="flex gap-1.5">
            <dt className="opacity-70">{item.label}:</dt>
            <dd className="text-foreground/70">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
