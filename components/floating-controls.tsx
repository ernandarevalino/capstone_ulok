'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, ArrowUp } from 'lucide-react'

export function FloatingControls() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (!mounted) return null

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[90] flex flex-row sm:flex-col items-center gap-2 sm:gap-3">
      {/* === TOMBOL: SCROLL TO TOP === */}
      <button
        onClick={scrollToTop}
        className={`w-10 h-10 sm:w-12 sm:h-12 p-2 sm:p-3 bg-white/75 dark:bg-gray-800/75 text-gray-800 dark:text-gray-200 backdrop-blur-md rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer ${
          showScrollTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        title="Scroll to Top"
        aria-label="Scroll to Top"
      >
        <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
      </button>

      {/* === TOMBOL: THEME TOGGLE === */}
      <button
        onClick={toggleTheme}
        className="w-10 h-10 sm:w-12 sm:h-12 p-2 sm:p-3 bg-white/75 dark:bg-gray-800/75 text-gray-800 dark:text-gray-200 backdrop-blur-md rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
        title={theme === 'dark' ? 'White Mode' : 'Dark Mode'}
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
        ) : (
          <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-[#142B4D]" />
        )}
      </button>
    </div>
  )
}
