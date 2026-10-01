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

export interface TripChartData {
  day: string;
  count: number;
}

export default function TripChart({ data }: { data: TripChartData[] }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Trip 7 Hari Terakhir
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Jumlah trip dibuat per hari
        </p>
      </div>
      <div className="px-4 py-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-zinc-200 dark:text-zinc-800"
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              className="text-zinc-500 dark:text-zinc-400"
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              className="text-zinc-500 dark:text-zinc-400"
            />
            <Tooltip
              cursor={{ fill: "rgba(113, 113, 130, 0.08)" }}
              contentStyle={{
                backgroundColor: "rgba(24, 24, 27, 0.95)",
                border: "1px solid rgba(63, 63, 70, 0.8)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#fafafa",
              }}
              formatter={(value) => [value, "Trip"]}
            />
            <Bar
              dataKey="count"
              fill="#18181b"
              className="dark:fill-zinc-100"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
