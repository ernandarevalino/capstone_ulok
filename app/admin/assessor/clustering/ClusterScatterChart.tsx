'use client'

import React, { useRef, useState, useCallback, memo } from 'react'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine
} from 'recharts'

// === Tooltip (module scope: never redefined on parent re-render) ===
const CustomScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload
    return (
      <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl space-y-2 text-xs max-w-xs transition-colors duration-200">
        <div className="font-bold text-gray-900 dark:text-gray-100 text-[13px]">{item.nama_lokasi}</div>
        <div className="text-[10px] text-gray-400">a.n {item.nama_pemegang_hak || '-'}</div>
        <hr className="border-gray-100 dark:border-gray-800" />
        <div className="space-y-1 text-gray-600 dark:text-gray-300">
          <p><span className="text-gray-400">Cabang:</span> <strong className="font-bold text-gray-700 dark:text-gray-200">{item.profiles?.branches?.nama_cabang || '-'}</strong></p>
          <p><span className="text-gray-400">Kelengkapan:</span> <strong className="font-bold text-[#F28705]">{item.persentase?.toFixed(1)}%</strong> ({item.numerator}/{item.denominator} Dokumen)</p>
          <p><span className="text-gray-400">Durasi:</span> <strong className="font-bold text-gray-700 dark:text-gray-200">{item.durasi_hari} Hari</strong></p>
          <p><span className="text-gray-400">Status:</span> <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-slate-200">{item.status}</span></p>
        </div>
      </div>
    )
  }
  return null
}

const quadrantInfo = {
  c3: { label: 'Cluster 1', subtitle: 'Lengkap & Cepat (≥80%, ≤7 Hari)' },
  c2: { label: 'Cluster 2', subtitle: 'Belum Lengkap & Cepat (<80%, ≤7 Hari)' },
  c1: { label: 'Cluster 3', subtitle: 'Lengkap & Lambat (≥80%, >7 Hari)' },
  c4: { label: 'Cluster 4', subtitle: 'Belum Lengkap & Lambat (<80%, >7 Hari)' }
} as const

type QuadrantKey = keyof typeof quadrantInfo

interface ClusterScatterChartProps {
  c1: any[]
  c2: any[]
  c3: any[]
  c4: any[]
  maxX: number
  onViewDetail: (id: string, jenisBadanHukum: string) => void
}

function ClusterScatterChart({ c1, c2, c3, c4, maxX, onViewDetail }: ClusterScatterChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const rafId = useRef<number | null>(null)

  // Hover state lives ONLY inside this chart component now.
  // Sebelumnya state ini ada di komponen page utama, jadi tiap mousemove
  // di atas chart bikin SELURUH halaman (tabs, tabel, dsb) ikut re-render.
  const [quadrantHover, setQuadrantHover] = useState<{
    label: string
    subtitle: string
    x: number
    y: number
  } | null>(null)

  // Throttle pakai requestAnimationFrame: mousemove bisa nembak puluhan
  // event per detik, ini batasin update state maksimal 1x per frame.
  const handleQuadrantHover = useCallback((key: QuadrantKey) => (e: any) => {
    if (rafId.current) return
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null
      const rect = chartContainerRef.current?.getBoundingClientRect()
      if (!rect) return
      setQuadrantHover({
        ...quadrantInfo[key],
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    })
  }, [])

  const handleQuadrantLeave = useCallback(() => setQuadrantHover(null), [])

  const handleClusterClick = useCallback((e: any) => {
    if (e && e.payload && e.payload.id) {
      onViewDetail(e.payload.id, e.payload.jenis_badan_hukum)
    }
  }, [onViewDetail])

  return (
    <div className="w-full mt-6 relative flex-1 flex flex-col justify-center" ref={chartContainerRef}>
      <ResponsiveContainer width="100%" height={480}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 10 }}>
          {/* 1 grid aja (bukan 2 versi light/dark) - warnanya ngikut currentColor */}
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-gray-800" />

          <XAxis
            type="number"
            dataKey="durasi_hari"
            name="Durasi"
            unit=" Hari"
            domain={[0, maxX]}
            stroke="#94A3B8"
            fontSize={11}
            fontWeight={600}
            label={{ value: 'Durasi Pengumpulan (Hari)', position: 'insideBottom', offset: -10, fontSize: 12, fontWeight: 700, fill: '#64748B' }}
            allowDataOverflow={true}
          />
          <YAxis
            type="number"
            dataKey="persentase"
            name="Kelengkapan"
            unit="%"
            domain={[0, 100]}
            stroke="#94A3B8"
            fontSize={11}
            fontWeight={600}
            label={{ value: 'Kelengkapan Dokumen (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' }, fontSize: 12, fontWeight: 700, fill: '#64748B' }}
            allowDataOverflow={true}
          />

          {/* Shading Areas for Quadrants */}
          <ReferenceArea
            x1={0} x2={7} y1={80} y2={100}
            fill="rgba(16, 185, 129, 0.08)"
            stroke="none"
            onMouseEnter={handleQuadrantHover('c3')}
            onMouseMove={handleQuadrantHover('c3')}
            onMouseLeave={handleQuadrantLeave}
            cursor="pointer"
          />
          <ReferenceArea
            x1={0} x2={7} y1={0} y2={80}
            fill="rgba(59, 130, 246, 0.08)"
            stroke="none"
            onMouseEnter={handleQuadrantHover('c2')}
            onMouseMove={handleQuadrantHover('c2')}
            onMouseLeave={handleQuadrantLeave}
            cursor="pointer"
          />
          <ReferenceArea
            x1={7} x2={maxX} y1={80} y2={100}
            fill="rgba(245, 158, 11, 0.08)"
            stroke="none"
            onMouseEnter={handleQuadrantHover('c1')}
            onMouseMove={handleQuadrantHover('c1')}
            onMouseLeave={handleQuadrantLeave}
            cursor="pointer"
          />
          <ReferenceArea
            x1={7} x2={maxX} y1={0} y2={80}
            fill="rgba(239, 68, 68, 0.08)"
            stroke="none"
            onMouseEnter={handleQuadrantHover('c4')}
            onMouseMove={handleQuadrantHover('c4')}
            onMouseLeave={handleQuadrantLeave}
            cursor="pointer"
          />

          {/* Quad Dividers */}
          <ReferenceLine x={7} stroke="#94A3B8" strokeDasharray="3 3" />
          <ReferenceLine y={80} stroke="#94A3B8" strokeDasharray="3 3" />

          <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />

          <Scatter
            name="Cluster 1 (Ideal)"
            data={c3}
            fill="#10B981"
            line={false}
            cursor="pointer"
            onClick={handleClusterClick}
          />
          <Scatter
            name="Cluster 2 (Aktif)"
            data={c2}
            fill="#3B82F6"
            line={false}
            cursor="pointer"
            onClick={handleClusterClick}
          />
          <Scatter
            name="Cluster 3 (Review)"
            data={c1}
            fill="#F28705"
            line={false}
            cursor="pointer"
            onClick={handleClusterClick}
          />
          <Scatter
            name="Cluster 4 (Stagnan)"
            data={c4}
            fill="#D91E2E"
            line={false}
            cursor="pointer"
            onClick={handleClusterClick}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Quadrant Hover Tooltip */}
      {quadrantHover && (
        <div
          className="absolute z-20 pointer-events-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-xs"
          style={{
            left: quadrantHover.x + 12,
            top: quadrantHover.y + 12
          }}
        >
          <p className="font-bold text-gray-900 dark:text-white">{quadrantHover.label}</p>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">{quadrantHover.subtitle}</p>
        </div>
      )}
    </div>
  )
}

// memo: chart cuma re-render kalau data/maxX beneran berubah,
// bukan tiap kali parent re-render karena state lain (search, filter, dll)
export default memo(ClusterScatterChart)
