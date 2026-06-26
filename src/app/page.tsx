import { ReportShell } from "@/components/report-shell";
import { GemeindeSearch } from "@/components/gemeinde-search";
import { getSpendingDataset } from "@/lib/spending/zh-spending";

const dataset = getSpendingDataset();

export default function Home() {
  return (
    <ReportShell>
      <div className="mx-auto flex max-w-xl flex-col gap-8 text-center">
        <div className="space-y-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Canton Zürich · {dataset.year}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Does your municipality spend more or less per resident than similar
            towns?
          </h1>
          <p className="text-base text-muted-foreground text-balance sm:text-lg">
            One clear answer from official Gemeinde data — operating expenditure
            per resident, compared to municipalities of similar size.
          </p>
        </div>

        <div className="text-left">
          <GemeindeSearch autoFocus placeholder="Find your Gemeinde…" />
        </div>

        <p className="text-xs text-muted-foreground">
          {dataset.coverage.communeCount} municipalities in Canton Zürich · Source:{" "}
          <a
            href={dataset.source.url}
            className="underline underline-offset-2 hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            {dataset.source.publisher}
          </a>
        </p>
      </div>
    </ReportShell>
  );
}
