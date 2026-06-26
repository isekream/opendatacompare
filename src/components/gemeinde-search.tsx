"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { searchGemeinden } from "@/lib/spending/zh-spending";
import type { GemeindeSpending } from "@/lib/spending/types";

type GemeindeSearchProps = {
  placeholder?: string;
  autoFocus?: boolean;
};

export function GemeindeSearch({
  placeholder = "Search your Gemeinde…",
  autoFocus = false,
}: GemeindeSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => searchGemeinden(query), [query]);

  function selectCommune(commune: GemeindeSpending) {
    setQuery("");
    router.push(`/gemeinde/${commune.bfsNumber}`);
  }

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="h-11 bg-background pl-10 text-base"
        aria-label="Search Gemeinde"
        aria-autocomplete="list"
      />

      {suggestions.length > 0 ? (
        <ul
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
          role="listbox"
        >
          {suggestions.map((commune) => (
            <li key={commune.bfsNumber}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                onClick={() => selectCommune(commune)}
              >
                <span className="font-medium">{commune.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {commune.canton}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
