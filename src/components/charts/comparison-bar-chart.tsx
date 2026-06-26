"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useChartTheme } from "@/components/charts/use-chart-theme";
import { communeSeriesColor } from "@/lib/dashboard/series-colors";
import {
  formatMetricValue,
  getCommuneMetricValue,
} from "@/lib/finance/zh-finance";
import type { CommuneFinance, FinanceMetricId, MetricFormat } from "@/lib/finance/types";

type ComparisonBarChartProps = {
  communes: CommuneFinance[];
  metricId: FinanceMetricId;
  format: MetricFormat;
  median: number;
};

type ChartRow = {
  name: string;
  value: number;
  fill: string;
};

function ChartTooltip({
  active,
  payload,
  format,
}: {
  active?: boolean;
  payload?: { payload: ChartRow }[];
  format: MetricFormat;
}) {
  const theme = useChartTheme();

  if (!active || !payload?.[0]?.payload) return null;

  const row = payload[0].payload;
  return (
    <div
      className="rounded-lg border px-3 py-2 font-mono text-xs shadow-md"
      style={{
        background: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
      }}
    >
      <p className="font-medium text-foreground">{row.name}</p>
      <p className="mt-1 text-muted-foreground">
        {formatMetricValue(row.value, format)}
      </p>
    </div>
  );
}

export function ComparisonBarChart({
  communes,
  metricId,
  format,
  median,
}: ComparisonBarChartProps) {
  const theme = useChartTheme();

  const rows: ChartRow[] = communes.map((commune, index) => ({
    name: commune.name,
    value: getCommuneMetricValue(commune, metricId) ?? 0,
    fill: communeSeriesColor(index),
  }));

  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
        >
          <CartesianGrid
            horizontal={false}
            stroke={theme.grid}
            strokeDasharray="3 3"
          />
          <XAxis
            type="number"
            tick={{ fill: theme.tick, fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => formatMetricValue(value, format)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={108}
            tick={{ fill: theme.tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(127,127,127,0.08)" }}
            content={<ChartTooltip format={format} />}
          />
          <ReferenceLine
            x={median}
            stroke={theme.reference}
            strokeDasharray="4 4"
            label={{
              value: `median ${formatMetricValue(median, format)}`,
              position: "insideTopRight",
              fill: theme.tick,
              fontSize: 10,
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {rows.map((row) => (
              <Cell key={row.name} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
