'use client'

import React, { useState } from 'react'
import { Maximize2, Minimize2, BarChart3, X } from 'lucide-react'

interface ChartFullscreenWrapperProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export default function ChartFullscreenWrapper({ title, subtitle, children }: ChartFullscreenWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const ChartHeader = () => (
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-[#3365A6]"/>
          {title}
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          {subtitle}
        </p>
      </div>
      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all duration-200 active:scale-95 border border-gray-200 dark:border-gray-700 shadow-sm"
        title={isFullscreen ? "Keluar Fullscreen" : "Lihat Fullscreen"}
      >
        {isFullscreen ? <Minimize2 className="w-5 h-5"/> : <Maximize2 className="w-5 h-5"/>}
      </button>
    </div>
  )

  return (
    <>
      {/* 1. Default Card View */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-5 md:p-6 rounded-2xl shadow-sm flex flex-col h-full">
        <ChartHeader/>
        <div className="flex-1 w-full min-h-[400px]">
          {children}
        </div>
      </div>

      {/* 2. Floating Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 w-full h-full rounded-2xl p-6 flex flex-col shadow-2xl relative animate-[scaleUp_0.2s_ease-out]">
            {/* Close Button overlay */}
            <button 
              onClick={() => setIsFullscreen(false)} 
              className="absolute top-6 right-6 p-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 rounded-full transition-all duration-200 z-10 active:scale-95"
            >
              <X className="w-6 h-6"/>
            </button>
            
            <ChartHeader/>
            <div className="flex-1 w-full h-full mt-2">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
