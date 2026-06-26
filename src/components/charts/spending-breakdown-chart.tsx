"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useChartTheme } from "@/components/charts/use-chart-theme";
import { formatMetricValue, getMetricDefinition } from "@/lib/finance/zh-finance";
import type { CommuneFinance, ExpenditureComponentId } from "@/lib/finance/types";

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

type SpendingBreakdownChartProps = {
  communes: CommuneFinance[];
};

export function SpendingBreakdownChart({ communes }: SpendingBreakdownChartProps) {
  const theme = useChartTheme();
  const operatingMetric = getMetricDefinition("operating_expenditure");
  const components = operatingMetric?.components ?? [];

  const data = communes.map((commune) => {
    const operating = commune.metrics.operating_expenditure;
    const row: Record<string, string | number> = {
      name: commune.name,
    };

    for (const component of components) {
      row[component.id] = operating?.components?.[component.id] ?? 0;
    }

    return row;
  });

  return (
    <div className="h-[320px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: theme.tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: theme.tick, fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => formatMetricValue(value, "currency")}
          />
          <Tooltip
            cursor={{ fill: "rgba(127,127,127,0.08)" }}
            formatter={(value, name) => [
              formatMetricValue(Number(value), "currency"),
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
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value) =>
              components.find((c) => c.id === value)?.label ?? value
            }
          />
          {components.map((component) => (
            <Bar
              key={component.id}
              dataKey={component.id}
              stackId="spend"
              fill={COMPONENT_HEX[component.id]}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
