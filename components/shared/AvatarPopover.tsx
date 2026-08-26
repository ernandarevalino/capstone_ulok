'use client'

import React, { useEffect, useRef } from 'react'
import { Mail, Building2, IdCard, X } from 'lucide-react'

export interface AvatarPopoverState {
  x: number
  y: number
  profile: {
    full_name?: string
    role?: string
    avatar_url?: string
    nik?: string | number
    branch_id?: number
    branches?: { nama_cabang?: string }
    email?: string
  }
}

interface AvatarPopoverProps {
  popover: AvatarPopoverState | null
  onClose: () => void
}

const POPOVER_WIDTH  = 288 // w-72
const POPOVER_HEIGHT = 220 // estimated

const empty = (val?: string | number | null) =>
  val === null || val === undefined || String(val).trim() === ''

export default function AvatarPopover({ popover, onClose }: AvatarPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!popover) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [popover, onClose])

  // Close on any scroll
  useEffect(() => {
    if (!popover) return
    const handler = () => onClose()
    window.addEventListener('scroll', handler, true)
    return () => window.removeEventListener('scroll', handler, true)
  }, [popover, onClose])

  if (!popover) return null

  const { x, y, profile } = popover

  // Clamp to viewport so popover never renders off-screen
  const vw   = typeof window !== 'undefined' ? window.innerWidth  : 1200
  const vh   = typeof window !== 'undefined' ? window.innerHeight : 800
  const left = Math.min(x + 10, vw - POPOVER_WIDTH  - 12)
  const top  = Math.min(y + 10, vh - POPOVER_HEIGHT - 12)

  const roleLabel =
    profile.role === 'assessor'     ? 'Assessor'     :
    profile.role === 'admin_cabang' ? 'Admin Cabang' :
    profile.role === 'super_admin'  ? 'Super Admin'  :
    profile.role                    ? profile.role   : 'Pengguna'

  const initial = profile.full_name?.charAt(0)?.toUpperCase() || '?'
  const nama    = profile.full_name || 'Pengguna'

  return (
    <div
      ref={ref}
      style={{ left, top, zIndex: 9999 }}
      className="
        fixed w-72 p-4
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-700
        rounded-xl shadow-xl
        animate-[fadeIn_0.12s_ease-out]
      "
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
        title="Tutup"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header: avatar + name + role */}
      <div className="flex items-center gap-3 mb-3 pr-5">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={nama}
            className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700 shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-lg font-bold text-white bg-[#142B4D] shadow-sm select-none">
            {initial}
          </div>
        )}

        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug truncate">
            {nama}
          </p>
          <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#142B4D]/10 dark:bg-blue-900/40 text-[#142B4D] dark:text-blue-300">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-800 mb-3" />

      {/* Detail rows: Branch → NIK → Email */}
      <ul className="space-y-2">

        {/* 1. Branch */}
        <li className="flex items-start gap-2.5">
          <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
          {empty(profile.branches?.nama_cabang) ? (
            <span className="text-xs text-gray-400 dark:text-gray-600 italic">Belum ada data</span>
          ) : (
            <span className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
              {profile.branches!.nama_cabang}
            </span>
          )}
        </li>

        {/* 2. NIK */}
        <li className="flex items-start gap-2.5">
          <IdCard className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
          {empty(profile.nik) ? (
            <span className="text-xs text-gray-400 dark:text-gray-600 italic">Belum ada data</span>
          ) : (
            <span className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
              {profile.nik}
            </span>
          )}
        </li>

        {/* 3. Email */}
        <li className="flex items-start gap-2.5">
          <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
          {empty(profile.email) ? (
            <span className="text-xs text-gray-400 dark:text-gray-600 italic">Belum ada data</span>
          ) : (
            <span className="text-xs text-gray-700 dark:text-gray-300 leading-snug break-all">
              {profile.email}
            </span>
          )}
        </li>

      </ul>
    </div>
  )
}
