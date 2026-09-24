"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/money";

export interface CategorySpendingDatum {
  name: string;
  totalMinor: number;
}

const SERIES_COLOR = "var(--chart-series-1)";

export function SpendingByCategoryChart({ data }: { data: CategorySpendingDatum[] }) {
  const chartData = data.slice(0, 8).map((d) => ({ ...d, total: d.totalMinor / 100 }));

  return (
    <div className="viz-root" style={{ height: Math.max(chartData.length * 40, 120) }}>
      <style>{`
        .viz-root {
          --chart-series-1: #2a78d6;
          --chart-muted: #898781;
          --chart-text: #52514e;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .viz-root {
            --chart-series-1: #3987e5;
            --chart-muted: #898781;
            --chart-text: #c3c2b7;
          }
        }
        :root[data-theme="dark"] .viz-root {
          --chart-series-1: #3987e5;
          --chart-muted: #898781;
          --chart-text: #c3c2b7;
        }
      `}</style>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 24 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--chart-text)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            formatter={(value) => formatMoney(Math.round(Number(value) * 100))}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
          />
          <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={16}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={SERIES_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
