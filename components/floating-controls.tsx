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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* === TOMBOL: SCROLL TO TOP === */}
      <button
        onClick={scrollToTop}
        className={`p-3 bg-white/75 dark:bg-gray-800/75 text-gray-800 dark:text-gray-200 backdrop-blur-md rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer ${
          showScrollTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        title="Scroll to Top"
        aria-label="Scroll to Top"
      >
        <ArrowUp className="w-5 h-5 animate-bounce" />
      </button>

      {/* === TOMBOL: THEME TOGGLE === */}
      <button
        onClick={toggleTheme}
        className="p-3 bg-white/75 dark:bg-gray-800/75 text-gray-800 dark:text-gray-200 backdrop-blur-md rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
        title={theme === 'dark' ? 'White Mode' : 'Dark Mode'}
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-500" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600" />
        )}
      </button>
    </div>
  )
}
