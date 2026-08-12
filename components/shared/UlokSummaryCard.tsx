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
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-2.5">
        <span className="font-semibold text-gray-900 dark:text-white">{namaLokasi}</span> merupakan usulan lokasi berjenis <span className="font-semibold text-gray-900 dark:text-white">{jenisKepemilikan}</span> yang diajukan oleh <span className="font-semibold text-gray-900 dark:text-white">{namaPengusul}</span> dari <span className="font-semibold text-gray-900 dark:text-white">{namaCabang}</span>. Saat ini, usulan berada pada status <span className="font-semibold text-gray-900 dark:text-white">{status}</span>. Dari keseluruhan <span className="font-semibold text-gray-900 dark:text-white">{totalDokumen} dokumen wajib</span>, sebanyak <span className="font-semibold text-gray-900 dark:text-white">{dokumenTerunggah} dokumen</span> telah terunggah. Dari dokumen yang terunggah tersebut, <span className="font-semibold text-gray-900 dark:text-white">{dokumenSesuai} dokumen sudah sesuai (diverifikasi)</span>, dan <span className="font-semibold text-gray-900 dark:text-white">{dokumenBelumSesuai} dokumen belum sesuai</span>.
      </p>
    </div>
  )
}