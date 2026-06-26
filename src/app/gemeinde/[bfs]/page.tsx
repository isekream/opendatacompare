import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { GemeindeBreakdownChart } from "@/components/charts/gemeinde-breakdown-chart";
import { PeerComparisonChart } from "@/components/charts/peer-comparison-chart";
import { ReportPanel, ReportShell } from "@/components/report-shell";
import { ShareReportLinkButton } from "@/components/share-report-link-button";
import { Button } from "@/components/ui/button";
import {
  buildSpendingReport,
  formatChf,
  formatPopulation,
  getAllGemeindeBfsNumbers,
  getGemeindeByBfs,
  getSpendingDataset,
  hasSpendingData,
} from "@/lib/spending/ch-spending";

type PageProps = {
  params: Promise<{ bfs: string }>;
};

const dataset = getSpendingDataset();

export function generateStaticParams() {
  return getAllGemeindeBfsNumbers().map((bfsNumber) => ({
    bfs: String(bfsNumber),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bfs } = await params;
  const commune = getGemeindeByBfs(Number(bfs));

  if (!commune) {
    return { title: "Gemeinde not found — OpenDataCompare" };
  }

  const report = buildSpendingReport(commune.bfsNumber);
  if (!report) {
    const title = `${commune.name} — OpenDataCompare`;
    const description = `Official spending data is not yet available for ${commune.name}.`;
    return { title, description, openGraph: { title, description } };
  }

  const { interpretation } = report;
  const title = `${commune.name} spending report — OpenDataCompare`;
  const description = interpretation.headline;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

function NoSpendingDataPanel({
  commune,
}: {
  commune: NonNullable<ReturnType<typeof getGemeindeByBfs>>;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card/80 p-6 sm:p-8">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Spending data not available
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        {commune.name} ({commune.canton}) has{" "}
        {formatPopulation(commune.population)} residents, but the federal
        Finanzstatistik does not publish harmonized per-municipality accounts
        for every commune. EFV reports individual Gemeinde finances mainly for
        municipalities with 5,000+ residents (plus selected smaller communes in
        full-census cantons).
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        We are expanding canton-level supplements where official OGD data can be
        calibrated to the same EFV metric. Try searching for a larger
        municipality nearby for a comparable spending report.
      </p>
    </section>
  );
}

export default async function GemeindeReportPage({ params }: PageProps) {
  const { bfs } = await params;
  const bfsNumber = Number(bfs);
  if (!Number.isFinite(bfsNumber)) notFound();

  const commune = getGemeindeByBfs(bfsNumber);
  if (!commune) notFound();

  const report = buildSpendingReport(bfsNumber);
  const shareUrl = `https://opendatacompare.com/gemeinde/${commune.bfsNumber}`;

  if (!report || !hasSpendingData(commune)) {
    return (
      <ReportShell
        title={commune.name}
        description={`${commune.canton} · ${formatPopulation(commune.population)} residents · ${dataset.year}`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button render={<Link href="/" />} variant="outline" size="sm">
              <ArrowLeft />
              All municipalities
            </Button>
          </div>
          <NoSpendingDataPanel commune={commune} />
        </div>
      </ReportShell>
    );
  }

  const { peers, peerBand, interpretation } = report;
  const peerPopulations = peers.map((peer) => peer.population);
  const minPeerPopulation = Math.min(...peerPopulations);
  const maxPeerPopulation = Math.max(...peerPopulations);

  return (
    <ReportShell
      title={commune.name}
      description={`Operating expenditure per resident · ${dataset.year} · compared to ${peers.length} similar municipalities`}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button render={<Link href="/" />} variant="outline" size="sm">
            <ArrowLeft />
            All municipalities
          </Button>
          <ShareReportLinkButton url={shareUrl} />
        </div>

        <section className="rounded-xl border border-border/60 bg-card/80 p-6 sm:p-8">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Operating expenditure per resident
          </p>
          <p className="mt-2 font-mono text-4xl font-semibold tracking-tight sm:text-5xl">
            {formatChf(commune.operatingExpenditure.value)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatPopulation(commune.population)} residents · {commune.canton} ·{" "}
            {dataset.year}
            {commune.dataSource === "efv_calibrated"
              ? " · EFV-calibrated estimate"
              : null}
          </p>

          <div className="mt-6 rounded-lg border border-border/50 bg-surface px-4 py-3">
            <p className="text-sm font-medium">{interpretation.headline}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {interpretation.detail}
            </p>
          </div>
        </section>

        <ReportPanel
          title="Compared to similar municipalities"
          description={`Peers are the ${peers.length} Swiss municipalities closest in population size (${formatPopulation(minPeerPopulation)}–${formatPopulation(maxPeerPopulation)} residents).`}
        >
          <PeerComparisonChart
            commune={commune}
            peers={peers}
            peerMedian={peerBand.median}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Highlighted bar is {commune.name}. Dashed line is the peer median (
            {formatChf(peerBand.median)}). Typical peer range:{" "}
            {formatChf(peerBand.p25)}–{formatChf(peerBand.p75)}.
          </p>
        </ReportPanel>

        <ReportPanel
          title="Where the money goes"
          description="Share of operating expenditure by service area"
        >
          <GemeindeBreakdownChart commune={commune} />
        </ReportPanel>

        <ReportPanel title="How we calculate this">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>{dataset.metric.methodology.summary}</p>
            <div>
              <p className="font-medium text-foreground">Included</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                {dataset.metric.methodology.includes?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">Excluded</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                {dataset.metric.methodology.excludes?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">Sources</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>
                  <a
                    href={dataset.source.url}
                    className="underline underline-offset-2 hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {dataset.source.dataset}
                  </a>{" "}
                  — {dataset.source.name}
                </li>
                <li>Population: {dataset.source.populationIndicator}</li>
              </ul>
            </div>
          </div>
        </ReportPanel>
      </div>
    </ReportShell>
  );
}
