"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { WeeklyPoint } from "@/lib/types/dashboard";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?:   boolean;
  payload?:  Array<{ name: string; value: number; color: string }>;
  label?:    string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-bg-border bg-bg-surface p-3 shadow-card text-sm">
      <p className="font-semibold text-text mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-text-muted capitalize">{entry.name}:</span>
          <span className="font-medium text-text">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardChart({ data }: { data: WeeklyPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-bg-border">
        <p className="text-sm text-text-subtle">Sem dados para o período</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fill: "#8888a8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#8888a8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "#8888a8", paddingTop: 12 }}
        />
        <Bar
          dataKey="leads"
          name="leads"
          fill="#5b6ef5"
          fillOpacity={0.85}
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
        <Line
          type="monotone"
          dataKey="vendas"
          name="vendas"
          stroke="#22d37a"
          strokeWidth={2}
          dot={{ fill: "#22d37a", r: 3 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
