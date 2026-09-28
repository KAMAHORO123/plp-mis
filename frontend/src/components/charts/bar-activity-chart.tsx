import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface BarPoint {
  label: string;
  value: number;
  total: number;
}

interface BarActivityChartProps {
  data: BarPoint[];
  height?: number;
}

export function BarActivityChart({ data, height = 300 }: BarActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }} barGap={-18}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          dy={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          width={42}
        />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            boxShadow: "0 12px 32px -8px rgb(16 24 40 / 0.14)",
            fontSize: 12,
          }}
        />
        <Bar dataKey="total" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={22} />
        <Bar dataKey="value" fill="#60a5fa" radius={[6, 6, 0, 0]} barSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
