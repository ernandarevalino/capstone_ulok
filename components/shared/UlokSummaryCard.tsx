import React from 'react'

interface UlokSummaryCardProps {
  namaLokasi: string
  namaCabang: string
  namaPengusul: string
  jenisKepemilikan: string
  status: string
  totalDokumen: number
  dokumenTerunggah: number
  dokumenSesuai: number
  dokumenBelumSesuai: number
}

export default function UlokSummaryCard({
  namaLokasi,
  namaCabang,
  namaPengusul,
  jenisKepemilikan,
  status,
  totalDokumen,
  dokumenTerunggah,
  dokumenSesuai,
  dokumenBelumSesuai,
}: UlokSummaryCardProps) {
  return (
    <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 mb-6">
      <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
        💡 Ringkasan Usulan
      </h3>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-2">
        <span className="font-bold text-blue-700 dark:text-blue-400">{namaLokasi}</span> merupakan usulan lokasi berjenis <span className="font-bold text-gray-900 dark:text-white">{jenisKepemilikan}</span> yang diajukan oleh <span className="font-bold text-gray-900 dark:text-white">{namaPengusul}</span> dari <span className="font-bold text-blue-700 dark:text-blue-400">{namaCabang}</span>. Saat ini, usulan berada pada status <span className="font-bold text-amber-600 dark:text-amber-500">{status}</span>. Dari keseluruhan <span className="font-bold">{totalDokumen} dokumen wajib</span>, sebanyak <span className="font-bold text-gray-900 dark:text-white">{dokumenTerunggah} dokumen</span> telah terunggah. Dari dokumen yang terunggah tersebut, <span className="font-bold text-emerald-600 dark:text-emerald-400">{dokumenSesuai} dokumen sudah sesuai (diverifikasi)</span>, dan <span className="font-bold text-red-600 dark:text-red-400">{dokumenBelumSesuai} dokumen belum sesuai</span>.
      </p>
    </div>
  )
}
