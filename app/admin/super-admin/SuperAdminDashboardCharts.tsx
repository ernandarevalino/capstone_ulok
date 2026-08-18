'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#111C34] p-3 rounded-xl border border-gray-200 dark:border-gray-800/60 shadow-lg transition-colors duration-300">
        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
          {payload[0].name}
        </p>
        <p
          className="text-xs font-extrabold mt-1"
          style={{ color: payload[0].payload.color }}
        >
          {payload[0].value} Entitas
        </p>
      </div>
    );
  }

  return null;
};

interface SuperAdminDashboardChartsProps {
  displayChartData: { name: string; value: number; color: string }[];
}

export default function SuperAdminDashboardCharts({
  displayChartData
}: SuperAdminDashboardChartsProps) {
  return (
    <div
      className="
        h-auto
        sm:h-72
        md:h-64
        flex
        flex-col
        md:flex-row
        items-center
        justify-around
        gap-4
        overflow-visible
      "
    >
      <div
        className="
          w-full
          md:w-1/2
          h-64
          sm:h-64
          md:h-full
          shrink-0
        "
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayChartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
            >
              {displayChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="outline-none stroke-white dark:stroke-slate-900 stroke-2"
                />
              ))}
            </Pie>

            <Tooltip content={<CustomChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full md:w-1/2 flex flex-col gap-2 min-w-0">
        <h4 className="text-xs font-extrabold uppercase text-gray-400 dark:text-slate-500 tracking-wider mb-2">
          Legenda Parameter
        </h4>

        {displayChartData.map((entry, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-xs font-semibold py-1.5 border-b border-gray-50 dark:border-gray-800/30 min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-3.5 h-3.5 shrink-0 rounded-md"
                style={{ backgroundColor: entry.color }}
              />

              <span className="text-gray-700 dark:text-gray-300 truncate">
                {entry.name}
              </span>
            </div>

            <span className="text-gray-900 dark:text-white font-extrabold shrink-0">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}