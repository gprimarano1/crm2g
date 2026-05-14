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
import type { WeekChartData } from "@/lib/actions/clientes";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);

interface MetricasChartProps {
  data: WeekChartData[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-bg-border bg-bg-surface p-3 shadow-card text-sm">
      <p className="font-semibold text-text mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-text-muted capitalize">{entry.name}:</span>
          <span className="font-medium text-text">
            {entry.name === "receita"
              ? formatCurrency(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MetricasChart({ data }: MetricasChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-bg-border">
        <p className="text-sm text-text-subtle">Sem dados suficientes para o gráfico</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
      >
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
          yAxisId="left"
          tick={{ fill: "#8888a8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "#8888a8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "#8888a8", paddingTop: 12 }}
        />
        <Bar
          yAxisId="left"
          dataKey="leads"
          name="leads"
          fill="#5b6ef5"
          fillOpacity={0.8}
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="vendas"
          name="vendas"
          stroke="#22d37a"
          strokeWidth={2}
          dot={{ fill: "#22d37a", r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="receita"
          name="receita"
          stroke="#f5c542"
          strokeWidth={2}
          dot={{ fill: "#f5c542", r: 3 }}
          activeDot={{ r: 5 }}
          strokeDasharray="4 2"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
