'use client'

import React, { useState } from 'react'

interface UploadSlotProps {
  docType: string
  label: string
  subLabel: string
  uploadedDocs: any[]
  isPending: boolean
  handleFileUpload: (docType: string, file: File) => Promise<void> | void
  handleMultipleFileUpload?: (docType: string, files: FileList) => Promise<void> | void
  setDeleteTarget: (target: { id: string; url: string } | null) => void
  formatWaktu: (uploadedAt: string | null | undefined) => string
}

export default function UploadSlot({
  docType,
  label,
  subLabel,
  uploadedDocs,
  isPending,
  handleFileUpload,
  handleMultipleFileUpload,
  setDeleteTarget,
  formatWaktu,
}: UploadSlotProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleAccordion = () => {
    setIsOpen(prev => !prev)
  }

  if (docType === 'dokumen_tambahan') {
    const existingFiles = uploadedDocs.filter(doc => doc.document_type === docType)
    return (
      <div className="bg-gray-50 dark:bg-gray-800/25 p-3 rounded-2xl flex flex-col justify-between gap-2 transition hover:bg-gray-100 dark:hover:bg-gray-800/40">
        <div>
          <span className="font-bold text-gray-700 dark:text-gray-300 text-[11px] block">{label}</span>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{subLabel}</p>
        </div>
        {existingFiles.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {existingFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-950/20 p-1.5 rounded border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold truncate max-w-none">
                  📄 Tersimpan{formatWaktu(file.uploaded_at)}
                </span>
                <div className="flex gap-1.5 items-center">
                  <a 
                    href={file.file_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all"
                    title="View File"
                  >
                    <img src="/icons/icon-view.svg" alt="View" className="w-3.5 h-3.5 object-contain dark:invert" />
                  </a>
                  <button 
                    type="button" 
                    onClick={() => setDeleteTarget({ id: file.id, url: file.file_url })} 
                    className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-red-650 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 transition-all"
                    title="Delete File"
                  >
                    <img src="/icons/icon-remove.svg" alt="Delete" className="w-3.5 h-3.5 object-contain" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <input 
          type="file" 
          multiple
          accept=".pdf, .jpg, .jpeg, .png"
          disabled={isPending}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              if (handleMultipleFileUpload) {
                handleMultipleFileUpload(docType, e.target.files)
              } else if (e.target.files[0]) {
                handleFileUpload(docType, e.target.files[0])
              }
            }
          }}
          className="text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-gray-200 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-300 dark:hover:file:bg-gray-600 file:cursor-pointer w-full text-gray-400 dark:text-gray-500 animate-fadeIn" 
        />
      </div>
    )
  }

  const allFiles = uploadedDocs.filter(doc => doc.document_type === docType)
  const latestFile = allFiles.find(doc => doc.is_latest) || allFiles[0]
  const historyFiles = latestFile ? allFiles.filter(doc => doc.id !== latestFile.id) : []

  return (
    <div className="bg-gray-50 dark:bg-gray-800/25 p-3 rounded-2xl flex flex-col justify-between gap-2.5 transition hover:bg-gray-100 dark:hover:bg-gray-800/40">
      <div>
        <span className="font-bold text-gray-700 dark:text-gray-300 text-[11px] block">{label}</span>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{subLabel}</p>
      </div>

      {latestFile ? (
        <div className="space-y-2 w-full">
          <div className="flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/40 w-full">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-1 py-0.2 rounded text-[8px] uppercase tracking-wide">
                  v{latestFile.version || 1}
                </span>
                Terbaru
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                Tersimpan{formatWaktu(latestFile.uploaded_at)}
              </span>
            </div>
            <div className="flex gap-1.5 items-center shrink-0">
              <a 
                href={latestFile.file_url} 
                target="_blank" 
                rel="noreferrer" 
                className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all"
                title="View File"
              >
                <img src="/icons/icon-view.svg" alt="View" className="w-4 h-4 object-contain dark:invert" />
              </a>
              <button 
                type="button" 
                onClick={() => setDeleteTarget({ id: latestFile.id, url: latestFile.file_url })} 
                className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-red-650 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 transition-all"
                title="Delete File"
              >
                <img src="/icons/icon-remove.svg" alt="Delete" className="w-3.5 h-3.5 object-contain" />
              </button>
            </div>
          </div>

          {historyFiles.length > 0 && (
            <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-2 w-full">
              <button
                type="button"
                onClick={toggleAccordion}
                className="w-full flex items-center justify-between text-[9px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors py-0.5"
              >
                <span className="flex items-center gap-1 text-[10px]">
                  Riwayat File Lama ({historyFiles.length})
                </span>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {isOpen && (
                <div className="mt-1.5 space-y-1 pl-0.5 max-h-36 overflow-y-auto w-full">
                  {historyFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between gap-2 bg-gray-100/50 dark:bg-gray-800/30 p-1.5 rounded-lg border border-gray-200/40 dark:border-gray-700/20 w-full">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-0.5">
                          <span className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-455 px-1 py-0.2 rounded text-[7px]">
                            v{file.version || 1}
                          </span>
                          Versi Lama
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">
                          Unggah{formatWaktu(file.uploaded_at)}
                        </span>
                      </div>
                      <div className="flex gap-1 items-center shrink-0">
                        <a 
                          href={file.file_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="p-0.5 rounded bg-white dark:bg-gray-755 border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-300 transition-all"
                          title="View File"
                        >
                          <img src="/icons/icon-view.svg" alt="View" className="w-4 h-4 object-contain dark:invert" />
                        </a>
                        <button 
                          type="button" 
                          onClick={() => setDeleteTarget({ id: file.id, url: file.file_url })} 
                          className="p-0.5 rounded bg-white dark:bg-gray-755 border border-gray-200 dark:border-gray-700 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/10 hover:border-red-300 transition-all"
                          title="Delete"
                        >
                          <img src="/icons/icon-remove.svg" alt="Delete" className="w-4 h-4 object-contain" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-2 w-full">
            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 block mb-1">Unggah Versi Baru:</span>
            <input 
              type="file" 
              accept=".pdf, .jpg, .jpeg, .png"
              disabled={isPending}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) handleFileUpload(docType, e.target.files[0])
              }}
              className="text-[10px] file:mr-2 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 dark:file:bg-blue-950/20 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30 file:cursor-pointer w-full text-gray-455 dark:text-gray-500" 
            />
          </div>
        </div>
      ) : (
        <input 
          type="file" 
          accept=".pdf, .jpg, .jpeg, .png"
          disabled={isPending}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) handleFileUpload(docType, e.target.files[0])
          }}
          className="text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-gray-200 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-300 dark:hover:file:bg-gray-600 file:cursor-pointer w-full text-gray-400 dark:text-gray-500 animate-fadeIn" 
        />
      )}
    </div>
  )
}
