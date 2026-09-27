'use client'

import { useEffect, useRef } from 'react'

const PING_INTERVAL_MS = 15 * 60 * 1000 // 15 menit

export default function SessionHeartbeat() {
  const lastPingRef = useRef<number>(0)

  useEffect(() => {
    const sendHeartbeat = () => {
      // SYARAT MUTLAK: Ping hanya dikirim jika tab browser sedang terbuka/aktif (visible)
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return
      }

      const now = Date.now()
      if (now - lastPingRef.current >= PING_INTERVAL_MS) {
        lastPingRef.current = now
        fetch('/api/session/heartbeat', { method: 'POST' }).catch(() => {
          // Silent catch for network failure
        })
      }
    }

    // Ping pertama saat komponen mount (jika tab visible)
    sendHeartbeat()

    // 1. Periodic Heartbeat (setiap 15 menit) selagi tab aktif
    const intervalId = setInterval(sendHeartbeat, PING_INTERVAL_MS)

    // 2. Visibility-Aware Listener: Kirim ping saat pengguna kembali membuka tab jika sudah melampaui interval
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}
