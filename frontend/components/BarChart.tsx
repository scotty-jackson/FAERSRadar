/**
 * Bar chart component using Recharts for reaction comparisons
 */
import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface BarChartProps {
  data: any[];
  dataKey: string;
  nameKey?: string;
  title?: string;
  height?: number;
  color?: string;
  horizontal?: boolean;
  showValues?: boolean;
}

export default function BarChart({
  data,
  dataKey,
  nameKey = 'name',
  title,
  height = 400,
  color = '#0ea5e9',
  horizontal = false,
  showValues = false,
}: BarChartProps) {
  // Generate different colors for each bar
  const colors = [
    '#0ea5e9', // blue
    '#f59e0b', // orange
    '#ef4444', // red
    '#10b981', // green
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange-dark
  ];

  const CustomizedLabel = (props: any) => {
    const { x, y, width, value, height: barHeight } = props;

    if (horizontal) {
      return (
        <text
          x={x + width + 5}
          y={y + barHeight / 2}
          fill="#666"
          textAnchor="start"
          dominantBaseline="middle"
          fontSize={12}
        >
          {value.toLocaleString()}
        </text>
      );
    }

    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#666"
        textAnchor="middle"
        fontSize={12}
      >
        {value.toLocaleString()}
      </text>
    );
  };

  if (horizontal) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey={nameKey} type="category" width={150} />
            <Tooltip
              formatter={(value: any) => value.toLocaleString()}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <Bar
              dataKey={dataKey}
              label={showValues ? CustomizedLabel : false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={nameKey} angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip
            formatter={(value: any) => value.toLocaleString()}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <Legend />
          <Bar
            dataKey={dataKey}
            fill={color}
            label={showValues ? CustomizedLabel : false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
