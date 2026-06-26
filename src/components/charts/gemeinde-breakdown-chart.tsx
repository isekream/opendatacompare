"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useChartTheme } from "@/components/charts/use-chart-theme";
import { formatChf, getSpendingDataset } from "@/lib/spending/zh-spending";
import type { ExpenditureComponentId, GemeindeSpending } from "@/lib/spending/types";

const COMPONENT_HEX: Record<ExpenditureComponentId, string> = {
  administration: "#3b82f6",
  public_order: "#06b6d4",
  education: "#8b5cf6",
  social_security: "#ec4899",
  health: "#22c55e",
  transport: "#f59e0b",
  environment: "#64748b",
  culture: "#f97316",
};

type GemeindeBreakdownChartProps = {
  commune: GemeindeSpending;
};

export function GemeindeBreakdownChart({ commune }: GemeindeBreakdownChartProps) {
  const theme = useChartTheme();
  const components = getSpendingDataset().metric.components;

  const row: Record<string, string | number> = {
    name: commune.name,
  };

  for (const component of components) {
    row[component.id] =
      commune.operatingExpenditure.components[component.id] ?? 0;
  }

  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[row]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            stroke={theme.grid}
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: theme.tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{
              fill: theme.tick,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => formatChf(value)}
          />
          <Tooltip
            cursor={{ fill: "rgba(127,127,127,0.08)" }}
            formatter={(value, name) => [
              formatChf(Number(value)),
              components.find((c) => c.id === name)?.label ?? String(name),
            ]}
            contentStyle={{
              background: theme.tooltipBg,
              borderColor: theme.tooltipBorder,
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
          />
          {components.map((component) => (
            <Bar
              key={component.id}
              dataKey={component.id}
              stackId="spend"
              fill={COMPONENT_HEX[component.id]}
              maxBarSize={64}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
