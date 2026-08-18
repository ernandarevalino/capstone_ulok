'use client';

import React from 'react';
import { Layers, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-bold text-gray-800 dark:text-slate-100">{payload[0].name}</p>
        <p className="text-xs text-[#142B4D] dark:text-blue-400 font-black mt-0.5">
          {payload[0].value} Usulan
        </p>
      </div>
    );
  }
  return null;
};

interface AssessorDashboardChartsProps {
  displayPieData: { name: string; value: number; color: string }[];
  branchDistribution: { name: string; value: number }[];
}

export default function AssessorDashboardCharts({
  displayPieData,
  branchDistribution
}: AssessorDashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* PIE CHART CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 md:p-6 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="pb-3 sm:pb-4 mb-3 sm:mb-4">
          <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[#FE9A00] shrink-0" />
            Persentase Status Review Nasional
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            Komposisi tumpukan pekerjaan review saat ini
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-around gap-4 sm:gap-6">
          <div className="w-full sm:w-1/2 h-52 sm:h-60 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {displayPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="outline-none transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full sm:w-1/2 flex flex-col gap-2">
            {displayPieData.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs font-semibold py-2 px-2 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-600 dark:text-slate-300 truncate">
                    {entry.name}
                  </span>
                </div>
                <span className="text-gray-900 dark:text-slate-100 font-bold bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0 ml-2">
                  {entry.value} Data
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BAR CHART CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 md:p-6 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="pb-3 sm:pb-4 mb-3 sm:mb-4">
          <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#142B4D] dark:text-blue-400 shrink-0" />
            Top 5 Cabang Teraktif (Volume Usulan)
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            Cabang penyuplai usulan lokasi terbanyak di luar tipe draf
          </p>
        </div>
        <div className="h-52 sm:h-60 md:h-64 w-full">
          {branchDistribution.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
              Tidak ada data distribusi cabang
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F1F5F9"
                  className="dark:stroke-slate-800"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fontWeight: 500 }}
                  stroke="#94A3B8"
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontWeight: 500 }}
                  stroke="#94A3B8"
                  allowDecimals={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: 'rgba(20, 43, 77, 0.04)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {branchDistribution.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={['#142B4D', '#1D3C6A', '#2B548F', '#3B6FB8', '#5B8CE0'][index % 5]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
