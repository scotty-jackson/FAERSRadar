/**
 * Time series chart component using Recharts
 */
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TimeSeriesChartProps {
  data: any[];
  lines: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  xAxisKey?: string;
  title?: string;
  height?: number;
}

export default function TimeSeriesChart({
  data,
  lines,
  xAxisKey = 'date_label',
  title,
  height = 400,
}: TimeSeriesChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
