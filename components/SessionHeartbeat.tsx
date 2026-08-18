'use client'

import { useEffect, useRef } from 'react'

const THROTTLE_MS = 60 * 1000 // 60 detik

export default function SessionHeartbeat() {
  const lastPingRef = useRef<number>(0)

  useEffect(() => {
    const sendHeartbeat = () => {
      const now = Date.now()
      if (now - lastPingRef.current >= THROTTLE_MS) {
        lastPingRef.current = now
        fetch('/api/session/heartbeat', { method: 'POST' }).catch(() => {
          // Silent catch for network failure
        })
      }
    }

    const events = ['keydown', 'mousedown', 'touchstart']
    events.forEach((event) => {
      window.addEventListener(event, sendHeartbeat)
    })

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, sendHeartbeat)
      })
    }
  }, [])

  return null
}
