'use client'

import React from 'react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onConfirm: () => Promise<void> | void
  onCancel: () => void
  isPending: boolean
}

export default function DeleteConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  isPending,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
        <img src="/icons/icon-hand.svg" alt="Confirm" className="w-16 h-16 mx-auto mb-2" />
        <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
          Apakah Anda yakin ingin menghapus berkas ini?
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="bg-[#142B4D] hover:bg-[#1a3863] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="text-gray-500 dark:text-gray-400 hover:text-red-600 font-bold px-4 py-2 text-sm transition-all flex items-center gap-1.5"
          >
            {isPending ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              'Yes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
