"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  weight: number;
}

interface Props {
  title: string;
  data: DataPoint[];
}

export function ProgressChart({ title, data }: Props) {
  if (data.length === 0) return null;

  return (
    <div className="card-wood rounded-xl p-4 border border-[#7a5c35]/30">
      <h3 className="text-[#a83232] font-display font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#9b7a4a" fontSize={12} tickLine={false} />
          <YAxis stroke="#9b7a4a" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#2a1f0f",
              border: "1px solid #5a4428",
              borderRadius: "8px",
              color: "#e8dcc8",
            }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#8b2525"
            strokeWidth={2}
            dot={{ fill: "#8b2525", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
