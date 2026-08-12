'use client'

import React, { useState } from 'react'
import { Download, Upload } from 'lucide-react'

export interface ChecklistItem {
  nama_dokumen: string
  is_uploaded: boolean
  is_negotiable?: boolean
  file_url?: string | null
}

export interface DocumentChecklistPanelProps {
  percentage: number
  numerator: number
  denominator: number
  jenisBadanHukum: string
  checklistItems: ChecklistItem[]
  lastUploaderName?: string | null
  downloadingDocName?: string | null
  handleDownload?: (url: string, filename: string) => Promise<void> | void
  onUpload?: (docName: string, file: File) => void
  isUploadingDocName?: string | null
}

export default function DocumentChecklistPanel({
  percentage,
  numerator,
  denominator,
  jenisBadanHukum,
  checklistItems,
  lastUploaderName,
  downloadingDocName,
  handleDownload,
  onUpload,
  isUploadingDocName,
}: DocumentChecklistPanelProps) {
  const [internalDownloading, setInternalDownloading] = useState<string | null>(null)

  const activeDownloadingName = downloadingDocName !== undefined ? downloadingDocName : internalDownloading

  const defaultDownloadHandler = async (url: string, filename: string) => {
    if (!url) return
    setInternalDownloading(filename)
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl

      let actualFilename = filename
      try {
        const urlObj = new URL(url)
        const pathname = urlObj.pathname
        const ext = pathname.split('.').pop()
        if (ext && ext.length <= 4 && !filename.toLowerCase().endsWith('.' + ext.toLowerCase())) {
          actualFilename = `${filename}.${ext}`
        }
      } catch (e) {
        // fallback
      }

      a.download = actualFilename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading document:', error)
    } finally {
      setInternalDownloading(null)
    }
  }

  const onDownload = handleDownload || defaultDownloadHandler

  return (
    <div className="bg-white dark:bg-gray-950 rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800/85 shadow-sm space-y-4 w-full">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-850 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            📋 Status Checklist Dokumen ({percentage.toFixed(1)}% - {numerator}/{denominator} Terupload)
          </h4>

          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Terakhir diupload oleh:{' '}
            <strong className="font-semibold text-slate-800 dark:text-slate-100">
              {lastUploaderName || '-'}
            </strong>
          </span>
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          Jenis: {jenisBadanHukum}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {checklistItems && checklistItems.length > 0 ? (
          checklistItems.map((doc, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                doc.is_uploaded
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/80 dark:border-emerald-900/30 hover:border-emerald-250 dark:hover:border-emerald-800'
                  : 'bg-gray-50/40 dark:bg-gray-950/10 border-gray-150 dark:border-gray-900/40 hover:border-gray-250 dark:hover:border-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {doc.is_uploaded ? (
                  <span className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 text-xs font-bold bg-emerald-100/60 dark:bg-emerald-950/40 w-5 h-5 rounded-full flex items-center justify-center">
                    ✓
                  </span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-605 flex-shrink-0 text-xs font-bold bg-gray-100 dark:bg-gray-900/60 w-5 h-5 rounded-full flex items-center justify-center">
                    ✕
                  </span>
                )}
                <span
                  className={`text-xs font-semibold truncate ${
                    doc.is_uploaded
                      ? 'text-gray-800 dark:text-gray-205'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                  title={doc.nama_dokumen}
                >
                  {doc.nama_dokumen}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {doc.is_negotiable && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/40 select-none">
                    Opsional
                  </span>
                )}

                {doc.is_uploaded ? (
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-900/50">
                      Terunggah
                    </span>
                    <div className="flex gap-1">
                      {doc.file_url && (
                        <>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all flex items-center justify-center"
                            title="View File"
                          >
                            <img
                              src="/icons/icon-view.svg"
                              alt="View"
                              className="w-3 h-3 object-contain dark:invert"
                            />
                          </a>
                          <button
                            type="button"
                            disabled={activeDownloadingName === doc.nama_dokumen}
                            onClick={(e) => {
                              e.stopPropagation()
                              onDownload(doc.file_url!, doc.nama_dokumen)
                            }}
                            className="p-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all flex items-center justify-center disabled:opacity-50"
                            title="Download File"
                          >
                            {activeDownloadingName === doc.nama_dokumen ? (
                              <span className="w-3 h-3 border-2 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                          </button>
                        </>
                      )}
                      {onUpload && (
                        <label className="p-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all flex items-center justify-center cursor-pointer" title="Upload File">
                          {isUploadingDocName === doc.nama_dokumen ? (
                            <span className="w-3 h-3 border-2 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                          <input
                            type="file"
                            accept=".pdf, .jpg, .jpeg, .png"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                onUpload(doc.nama_dokumen, e.target.files[0])
                              }
                            }}
                            disabled={isUploadingDocName === doc.nama_dokumen}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-900/50 text-gray-500 dark:text-gray-450 border border-gray-200 dark:border-gray-800/80">
                      Belum
                    </span>
                    {onUpload && (
                      <label className="p-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all flex items-center justify-center cursor-pointer" title="Upload File">
                        {isUploadingDocName === doc.nama_dokumen ? (
                          <span className="w-3 h-3 border-2 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                        <input
                          type="file"
                          accept=".pdf, .jpg, .jpeg, .png"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              onUpload(doc.nama_dokumen, e.target.files[0])
                            }
                          }}
                          disabled={isUploadingDocName === doc.nama_dokumen}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-4 text-center text-xs text-gray-400 italic">
            Tidak ada data checklist wajib untuk badan hukum ini.
          </div>
        )}
      </div>
    </div>
  )
}
