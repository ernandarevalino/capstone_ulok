'use client'

import React from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts'

const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xl backdrop-blur-sm animate-fade-in">
        <p className="text-xs font-bold text-gray-800 dark:text-slate-100">
          {payload[0].name}
        </p>
        <p className="text-xs text-[#142B4D] dark:text-blue-400 font-black mt-0.5">
          {payload[0].value} Usulan
        </p>
      </div>
    )
  }

  return null
}

interface SubmissionsPieChartProps {
  displayChartData: Array<{
    name: string
    value: number
    color: string
  }>
}

export default function SubmissionsPieChart({ displayChartData }: SubmissionsPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={displayChartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {displayChartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              className="transition-all duration-300 hover:opacity-80 outline-none"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}
