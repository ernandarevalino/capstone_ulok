'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-bold text-gray-800 dark:text-slate-100">
          {payload[0].payload.name}
        </p>
        <p className="text-xs text-[#142B4D] dark:text-blue-400 font-black mt-0.5">
          {payload[0].value} Usulan
        </p>
      </div>
    );
  }

  return null;
};

interface SubmissionsPieChartProps {
  displayChartData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export default function SubmissionsPieChart({ displayChartData }: SubmissionsPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={displayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomChartTooltip />} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {displayChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
