'use client'

import React, { useState, useEffect, useTransition, useCallback } from 'react'
import { extendVendorToken, uploadVendorDocument } from '@/actions/vendor-token'
import { getEffectiveChecklistId, getChecklistMasterIds } from '@/utils/progress'
import {
  CheckCircle2,
  Upload,
  Eye,
  FileText,
  Clock,
  AlertCircle,
  RefreshCw,
  Building2,
} from 'lucide-react'

interface ChecklistMasterItem {
  id: number
  nama_dokumen: string
  jenis_badan_hukum: string
  is_negotiable?: boolean
}

interface DocumentRecord {
  id: string
  checklist_id: number | null
  document_type: string
  file_url: string
  is_latest: boolean
  version: number
  uploaded_at?: string
}

interface VendorUploadClientProps {
  token: string
  ulokId: string
  namaLokasi: string
  jenisBadanHukum: string
  checklistMaster: ChecklistMasterItem[]
  initialDocuments: DocumentRecord[]
}

export default function VendorUploadClient({
  token,
  ulokId,
  namaLokasi,
  jenisBadanHukum,
  checklistMaster,
  initialDocuments,
}: VendorUploadClientProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments)
  const [isPending, startTransition] = useTransition()
  const [uploadingDocName, setUploadingDocName] = useState<string | null>(null)
  const [successFlash, setSuccessFlash] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [heartbeatActive, setHeartbeatActive] = useState(true)

  // === HEARTBEAT: Extend token every 15 minutes ===
  useEffect(() => {
    if (!token) return

    const interval = setInterval(async () => {
      try {
        const res = await extendVendorToken(token)
        if (res.success) {
          setHeartbeatActive(true)
        } else {
          setHeartbeatActive(false)
        }
      } catch {
        setHeartbeatActive(false)
      }
    }, 15 * 60 * 1000) // every 15 minutes

    return () => clearInterval(interval)
  }, [token])

  // === BUILD CHECKLIST ITEMS ===
  // Determine which checklist IDs apply to this ULOK (using the same logic as Admin Cabang)
  const submissionMock = { jenis_badan_hukum: jenisBadanHukum }
  const relevantIds = getChecklistMasterIds(submissionMock, documents)

  const checklistItems = checklistMaster
    .filter((cm) => relevantIds.includes(cm.id))
    .sort((a, b) => a.id - b.id)
    .map((cm) => {
      const uploadedDoc = documents.find((d) => {
        if (d.is_latest === false) return false
        if (d.checklist_id === cm.id) return true
        const effId = getEffectiveChecklistId(d, jenisBadanHukum)
        return effId === cm.id
      })

      // Reverse-lookup document_type from checklist_id for the upload action
      const docTypeMap: Record<string, string> = buildDocTypeMap(jenisBadanHukum)
      const docType = Object.entries(docTypeMap).find(([, v]) => v === String(cm.id))?.[0] || `checklist_${cm.id}`

      return {
        checklistId: cm.id,
        namaDokumen: cm.nama_dokumen,
        isNegotiable: !!cm.is_negotiable,
        isUploaded: !!(uploadedDoc && uploadedDoc.file_url),
        fileUrl: uploadedDoc?.file_url || null,
        docType,
      }
    })

  const uploadedCount = checklistItems.filter((i) => i.isUploaded).length
  const totalCount = checklistItems.length
  const progress = totalCount > 0 ? Math.round((uploadedCount / totalCount) * 100) : 0

  // === UPLOAD HANDLER ===
  const handleUpload = useCallback(
    async (docType: string, namaDokumen: string, file: File) => {
      if (!file) return
      setUploadingDocName(namaDokumen)
      setErrorMsg(null)

      const formData = new FormData()
      formData.append('file', file)

      startTransition(async () => {
        const res = await uploadVendorDocument(token, docType, formData)

        if (res.success) {
          // Optimistically refresh: refetch documents from server via re-render won't work
          // so we'll add a mock entry to local state to reflect the upload
          setSuccessFlash(`✅ ${namaDokumen} berhasil diunggah!`)
          setTimeout(() => setSuccessFlash(null), 3000)

          // Reload page to get fresh server-side data (token page is a server component)
          // We signal by updating docs locally; for full refresh: window.location.reload()
          window.location.reload()
        } else {
          setErrorMsg(`Gagal mengunggah ${namaDokumen}: ${res.error}`)
          setTimeout(() => setErrorMsg(null), 4000)
        }

        setUploadingDocName(null)
      })
    },
    [token]
  )

  return (
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-[#0D0D0D] transition-colors duration-300">
      {/* ===== FIXED TOAST NOTIFICATIONS ===== */}
      {successFlash && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successFlash}
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 bg-[#D91E2E] text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-[fadeIn_0.2s_ease-out] max-w-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="bg-[#142B4D] text-white">
        <div className="max-w-3xl mx-auto px-4 py-5">
          {/* Top bar: branding + heartbeat */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                <span className="text-white text-xs font-black">P</span>
              </div>
              <span className="text-white/70 text-xs font-bold tracking-widest uppercase">PRISMA</span>
            </div>
            <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
              heartbeatActive
                ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                : 'bg-red-500/10 border-red-400/30 text-red-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${heartbeatActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              {heartbeatActive ? 'Sesi Aktif' : 'Sesi Berakhir'}
            </div>
          </div>

          {/* ULOK title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-white/70 shrink-0" />
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">
                Portal Unggah Dokumen Vendor
              </h1>
            </div>
            <p className="text-blue-200 font-semibold text-sm pl-7">{namaLokasi}</p>
            <p className="text-blue-300/60 text-xs pl-7">{jenisBadanHukum} · ID: {ulokId.substring(0, 8)}...</p>
          </div>

          {/* Progress bar */}
          <div className="mt-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-blue-200">{uploadedCount}/{totalCount} Dokumen Terunggah</span>
              <span className="text-white">{progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F28705] to-yellow-300 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Info card */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 flex items-start gap-3">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            <strong>Sesi ini aktif selama 1 jam</strong> dan diperpanjang otomatis setiap 15 menit selama halaman ini terbuka.
            Setelah kadaluarsa, minta link baru kepada tim Alfamidi.
          </p>
        </div>

        {/* Checklist Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800/80 overflow-hidden">
          <div className="bg-[#142B4D] dark:bg-slate-900 px-5 py-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-white/80" />
            <div>
              <h2 className="text-white font-bold text-sm tracking-wide">Daftar Dokumen Checklist</h2>
              <p className="text-blue-200/70 text-xs mt-0.5">Unggah setiap dokumen yang diminta di bawah ini</p>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {checklistItems.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm italic">
                Tidak ada dokumen checklist untuk jenis ini.
              </div>
            ) : (
              checklistItems.map((item, idx) => (
                <ChecklistRow
                  key={item.checklistId}
                  index={idx + 1}
                  item={item}
                  uploadingDocName={uploadingDocName}
                  isPending={isPending}
                  onUpload={handleUpload}
                />
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
            <div className="w-5 h-5 bg-[#142B4D] rounded flex items-center justify-center">
              <span className="text-white text-[9px] font-black">P</span>
            </div>
            <p className="text-xs font-semibold">PRISMA · Sistem Penilaian Lokasi Alfamidi</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== CHECKLIST ROW SUB-COMPONENT =====
interface ChecklistRowProps {
  index: number
  item: {
    checklistId: number
    namaDokumen: string
    isNegotiable: boolean
    isUploaded: boolean
    fileUrl: string | null
    docType: string
  }
  uploadingDocName: string | null
  isPending: boolean
  onUpload: (docType: string, namaDokumen: string, file: File) => void
}

function ChecklistRow({ index, item, uploadingDocName, isPending, onUpload }: ChecklistRowProps) {
  const isUploading = uploadingDocName === item.namaDokumen
  const isDisabled = isPending || !!uploadingDocName

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
        item.isUploaded
          ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200/80 dark:border-emerald-900/30'
          : 'bg-gray-50/50 dark:bg-gray-950/10 border-gray-200 dark:border-gray-800/60'
      }`}
    >
      {/* Left: icon + name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
          item.isUploaded
            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
            : 'bg-gray-100 dark:bg-gray-800/60 text-gray-400 dark:text-gray-500'
        }`}>
          {item.isUploaded ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{index}</span>}
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-semibold truncate ${
            item.isUploaded ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {item.namaDokumen}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {item.isNegotiable && (
              <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/40 px-1.5 py-0.5 rounded uppercase">
                Opsional
              </span>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wide ${
              item.isUploaded
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {item.isUploaded ? '✓ Terunggah' : 'Belum terunggah'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        {item.isUploaded && item.fileUrl && (
          <a
            href={item.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition"
            title="Lihat dokumen"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Lihat</span>
          </a>
        )}

        {/* Upload / Replace button */}
        <label
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer select-none ${
            isDisabled
              ? 'opacity-50 cursor-not-allowed'
              : item.isUploaded
              ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-700 hover:border-amber-300'
              : 'bg-[#142B4D] border-transparent text-white hover:bg-blue-900'
          }`}
          title={item.isUploaded ? 'Ganti dokumen' : 'Unggah dokumen'}
        >
          {isUploading ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-3 h-3" />
              <span className="hidden sm:inline">{item.isUploaded ? 'Ganti' : 'Unggah'}</span>
            </>
          )}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            disabled={isDisabled}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                onUpload(item.docType, item.namaDokumen, e.target.files[0])
                e.target.value = '' // reset to allow re-upload same file
              }
            }}
          />
        </label>
      </div>
    </div>
  )
}

// ===== DOC TYPE MAP HELPER =====
// Maps document_type strings to checklist IDs (reverse of getEffectiveChecklistId)
// Used to determine docType when uploading via checklist_id
function buildDocTypeMap(jbh: string): Record<string, string> {
  if (jbh === 'PT') {
    return {
      ektp_mewakili: '1', akta_pendirian: '2', akta_penyesuaian: '3',
      anggaran_dasar: '4', akta_direksi_komisaris: '5', nib_oss: '6',
      npwp_badan: '7', sppkp: '8', ektp_direksi: '9', akta_kuasa: '10',
      rups_persetujuan: '11', sertifikat_tanah: '12', ajb_girik: '13',
      sppt_pbb: '14', imb_pbg: '15', slf: '16',
    }
  }
  if (jbh === 'Yayasan') {
    return {
      ektp_mewakili: '17', akta_pendirian: '18', anggaran_dasar: '19',
      akta_pengurus: '20', nib_oss: '21', npwp_badan: '22', sppkp: '23',
      ektp_direksi: '24', akta_kuasa: '25', sertifikat_tanah: '26',
      ajb_girik: '27', sppt_pbb: '28', imb_pbg: '29', slf: '30',
    }
  }
  if (jbh === 'Koperasi') {
    return {
      ektp_mewakili: '31', akta_pendirian: '32', anggaran_dasar: '33',
      akta_pengurus: '34', nib_oss: '35', npwp_badan: '36', sppkp: '37',
      ektp_direksi: '38', akta_kuasa: '39', sertifikat_tanah: '40',
      ajb_girik: '41', sppt_pbb: '42', imb_pbg: '43', slf: '44',
    }
  }
  // Perorangan / Kuasa / Waris / Hibah
  return {
    ktp_pemilik: '45', ektp: '45', kitas_kitap: '46', npwp: '47',
    pkp_sppkp: '48', non_pkp: '48', kartu_keluarga: '49', buku_nikah: '50',
    persetujuan_pasangan: '51', dokumen_ganti_nama: '52', akta_cerai: '53',
    sertifikat_tanah: '54', ajb_girik: '55', sppt_pbb: '56', imb_pbg: '57',
    slf: '58', akta_kuasa: '59', ktp_kuasa: '60', akta_waris: '61',
    surat_kematian: '62', ktp_ahli_waris: '63', kk_ahli_waris: '64',
    akta_hibah: '65',
  }
}
