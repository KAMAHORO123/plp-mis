import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface StatusDonutChartProps {
  data: DonutSlice[];
  height?: number;
}

export function StatusDonutChart({ data, height = 220 }: StatusDonutChartProps) {
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="60%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={0}
            outerRadius={90}
            paddingAngle={1}
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((slice) => (
              <Cell key={slice.label} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="space-y-2.5 text-sm">
        {data.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-muted-foreground">{slice.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
