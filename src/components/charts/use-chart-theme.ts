"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  return {
    mounted,
    tick: isDark ? "#a1a1aa" : "#71717a",
    grid: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    reference: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
    tooltipBg: isDark ? "rgba(24,24,27,0.95)" : "rgba(255,255,255,0.96)",
    tooltipBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
  };
}
