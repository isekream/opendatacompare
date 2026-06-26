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
import { formatChf } from "@/lib/spending/zh-spending";
import type { GemeindeSpending } from "@/lib/spending/types";

type PeerComparisonChartProps = {
  commune: GemeindeSpending;
  peers: GemeindeSpending[];
  peerMedian: number;
};

type ChartRow = {
  name: string;
  value: number;
  isTarget: boolean;
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartRow }[];
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
      <p className="mt-1 text-muted-foreground">{formatChf(row.value)}</p>
    </div>
  );
}

export function PeerComparisonChart({
  commune,
  peers,
  peerMedian,
}: PeerComparisonChartProps) {
  const theme = useChartTheme();

  const rows: ChartRow[] = [
  ...peers.map((peer) => ({
      name: peer.name,
      value: peer.operatingExpenditure.value,
      isTarget: false,
    })),
    {
      name: commune.name,
      value: commune.operatingExpenditure.value,
      isTarget: true,
    },
  ].sort((a, b) => a.value - b.value);

  return (
    <div className="h-[320px] w-full min-w-0">
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
            tick={{
              fill: theme.tick,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => formatChf(value)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fill: theme.tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(127,127,127,0.08)" }}
            content={<ChartTooltip />}
          />
          <ReferenceLine
            x={peerMedian}
            stroke={theme.reference}
            strokeDasharray="4 4"
            label={{
              value: `peer median ${formatChf(peerMedian)}`,
              position: "insideTopRight",
              fill: theme.tick,
              fontSize: 10,
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {rows.map((row) => (
              <Cell
                key={row.name}
                fill={row.isTarget ? "var(--color-primary)" : theme.grid}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
