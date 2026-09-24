'use client'

import React, { useRef, useState, useCallback, useMemo, memo } from 'react'
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
  boundaryX?: number
  boundaryY?: number
  onViewDetail: (id: string, jenisBadanHukum: string) => void
}

// === Stable deterministic pseudo-random from a string seed ===
// Produces a consistent float in [0, 1) for the same seed string.
// This way jitter doesn't change every re-render (unlike Math.random()).
function seededRand(seed: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return (h >>> 0) / 4294967296
}

// Apply jitter to a list of items.
// jitterX: max shift on X axis (days), jitterY: max shift on Y axis (%)
// Jitter is bidirectional (negative/positive), and the item stays in its quadrant.
function applyJitter(
  items: any[],
  jitterX: number,
  jitterY: number,
  boundaryX: number,
  boundaryY: number,
  maxX: number,
  clusterSide: 'left' | 'right',  // left = <=boundaryX, right = >boundaryX
  yZone: 'high' | 'low'           // high = >=boundaryY, low = <boundaryY
): any[] {
  return items.map((item) => {
    const seed = item.id || String(item.nama_lokasi) + String(item.created_at)
    const rx = seededRand(seed + 'x')
    const ry = seededRand(seed + 'y')
    // bidirectional shift: scale to [-jitterX, +jitterX]
    const dx = (rx - 0.5) * 2 * jitterX
    const dy = (ry - 0.5) * 2 * jitterY

    let newX = (item.durasi_hari ?? 0) + dx
    let newY = (item.persentase ?? 0) + dy

    // Clamp X within quadrant boundaries with a small margin
    const margin = 0.25
    if (clusterSide === 'left') {
      newX = Math.max(margin, Math.min(boundaryX - margin, newX))
    } else {
      newX = Math.max(boundaryX + margin, Math.min(maxX - margin, newX))
    }

    // Clamp Y within quadrant boundaries with a small margin
    if (yZone === 'high') {
      newY = Math.max(boundaryY + margin, Math.min(100 - margin, newY))
    } else {
      newY = Math.max(margin, Math.min(boundaryY - margin, newY))
    }

    return {
      ...item,
      // _jittered_ values used only for rendering
      durasi_hari: parseFloat(newX.toFixed(2)),
      persentase: parseFloat(newY.toFixed(2)),
    }
  })
}

function ClusterScatterChart({ c1, c2, c3, c4, maxX, boundaryX = 7, boundaryY = 80, onViewDetail }: ClusterScatterChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const rafId = useRef<number | null>(null)

  const [quadrantHover, setQuadrantHover] = useState<{
    label: string
    subtitle: string
    x: number
    y: number
  } | null>(null)

  // Apply jitter to each cluster. useMemo so it only recomputes when data changes.
  // Jitter amounts tuned per cluster to spread without crossing quadrant boundaries.
  const jX = 2.8  // ±2.8 days on X
  const jY = 8    // ±8% on Y

  const jitteredC3 = useMemo(() => applyJitter(c3, jX, jY, boundaryX, boundaryY, maxX, 'left', 'high'), [c3, boundaryX, boundaryY, maxX])
  const jitteredC2 = useMemo(() => applyJitter(c2, jX, jY, boundaryX, boundaryY, maxX, 'left', 'low'), [c2, boundaryX, boundaryY, maxX])
  const jitteredC1 = useMemo(() => applyJitter(c1, jX, jY, boundaryX, boundaryY, maxX, 'right', 'high'), [c1, boundaryX, boundaryY, maxX])
  const jitteredC4 = useMemo(() => applyJitter(c4, jX, jY, boundaryX, boundaryY, maxX, 'right', 'low'), [c4, boundaryX, boundaryY, maxX])

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
    <div className="w-full h-full min-h-[480px] mt-6 relative flex-1 flex flex-col justify-center" ref={chartContainerRef}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 10 }}>
          {/* 1 grid aja (bukan 2 versi light/dark) - warnanya ngikut currentColor */}
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-gray-800" />

          <XAxis
            type="number"
            dataKey="durasi_hari"
            name="Durasi"
            unit=" Hari"
            domain={[0, maxX]}
            ticks={maxX === 21 ? [0, 7, 14, 21] : undefined}
            padding={{ left: 15, right: 15 }}
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
            padding={{ top: 15, bottom: 15 }}
            ticks={[0, 20, 40, 60, 80, 100]}
            stroke="#94A3B8"
            fontSize={11}
            fontWeight={600}
            label={{ value: 'Kelengkapan Dokumen (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' }, fontSize: 12, fontWeight: 700, fill: '#64748B' }}
            allowDataOverflow={true}
          />

          {/* Shading Areas for Quadrants */}
          <ReferenceArea
            x1={0} x2={boundaryX} y1={boundaryY} y2={100}
            fill="rgba(16, 185, 129, 0.08)"
            stroke="none"
            onMouseEnter={handleQuadrantHover('c3')}
            onMouseMove={handleQuadrantHover('c3')}
            onMouseLeave={handleQuadrantLeave}
            cursor="pointer"
          />
          <ReferenceArea
            x1={0} x2={boundaryX} y1={0} y2={boundaryY}
            fill="rgba(59, 130, 246, 0.08)"
            stroke="none"
            onMouseEnter={handleQuadrantHover('c2')}
            onMouseMove={handleQuadrantHover('c2')}
            onMouseLeave={handleQuadrantLeave}
            cursor="pointer"
          />
          <ReferenceArea
            x1={boundaryX} x2={maxX} y1={boundaryY} y2={100}
            fill="rgba(245, 158, 11, 0.08)"
            stroke="none"
            onMouseEnter={handleQuadrantHover('c1')}
            onMouseMove={handleQuadrantHover('c1')}
            onMouseLeave={handleQuadrantLeave}
            cursor="pointer"
          />
          <ReferenceArea
            x1={boundaryX} x2={maxX} y1={0} y2={boundaryY}
            fill="rgba(239, 68, 68, 0.08)"
            stroke="none"
            onMouseEnter={handleQuadrantHover('c4')}
            onMouseMove={handleQuadrantHover('c4')}
            onMouseLeave={handleQuadrantLeave}
            cursor="pointer"
          />

          {/* Quad Dividers */}
          <ReferenceLine x={boundaryX} stroke="#94A3B8" strokeDasharray="3 3" />
          <ReferenceLine y={boundaryY} stroke="#94A3B8" strokeDasharray="3 3" />

          <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />

          <Scatter
            name="Cluster 1 (Ideal)"
            data={jitteredC3}
            fill="#10B981"
            fillOpacity={0.72}
            line={false}
            cursor="pointer"
            onClick={handleClusterClick}
            stroke="white"
            strokeWidth={0.8}
          />
          <Scatter
            name="Cluster 2 (Aktif)"
            data={jitteredC2}
            fill="#3B82F6"
            fillOpacity={0.72}
            line={false}
            cursor="pointer"
            onClick={handleClusterClick}
            stroke="white"
            strokeWidth={0.8}
          />
          <Scatter
            name="Cluster 3 (Review)"
            data={jitteredC1}
            fill="#F28705"
            fillOpacity={0.72}
            line={false}
            cursor="pointer"
            onClick={handleClusterClick}
            stroke="white"
            strokeWidth={0.8}
          />
          <Scatter
            name="Cluster 4 (Stagnan)"
            data={jitteredC4}
            fill="#D91E2E"
            fillOpacity={0.72}
            line={false}
            cursor="pointer"
            onClick={handleClusterClick}
            stroke="white"
            strokeWidth={0.8}
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
