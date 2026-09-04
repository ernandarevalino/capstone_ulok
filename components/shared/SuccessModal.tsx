'use client'

import React from 'react'
import { CheckCircle2 } from 'lucide-react'

interface SuccessModalProps {
  isOpen: boolean
  message: string
}

export default function SuccessModal({ isOpen, message }: SuccessModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
        <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
        <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm md:text-base leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  )
}
