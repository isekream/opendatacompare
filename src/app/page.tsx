const features = [
  {
    title: "Side-by-side comparisons",
    description:
      "Put countries, regions, and metrics next to each other — not buried in spreadsheets or PDFs.",
  },
  {
    title: "Official sources only",
    description:
      "Every number links back to the government or statistical agency that published it.",
  },
  {
    title: "Built for everyone",
    description:
      "Clear charts and plain language — whether you are a citizen, journalist, or researcher.",
  },
] as const;

const launchTopics = [
  "Population & housing",
  "Public finances",
  "Environment & mobility",
  "Health & education",
] as const;

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm text-white"
            >
              OD
            </span>
            OpenDataCompare
          </div>
          <span className="rounded-full border border-border bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            Coming soon
          </span>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 sm:pt-28">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-accent">
            Global public data platform
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Compare public data,{" "}
            <span className="text-muted">anywhere.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            OpenDataCompare brings official government statistics into one place
            so you can compare jurisdictions, indicators, and trends — with full
            transparency about where every figure comes from.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="mailto:hello@opendatacompare.com"
              className="inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Get early access
            </a>
            <span className="inline-flex items-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm text-muted">
              Launching first in Switzerland
            </span>
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 sm:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title}>
                <h2 className="text-base font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            What we&apos;ll compare first
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Starting with Swiss federal and cantonal open data, then expanding
            to more countries and agencies.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {launchTopics.map((topic) => (
              <li
                key={topic}
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium"
              >
                {topic}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} OpenDataCompare</p>
          <p>Official data. Clear comparisons. No black boxes.</p>
        </div>
      </footer>
    </div>
  );
}
