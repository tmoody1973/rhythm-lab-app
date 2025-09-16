"use client"

import { useState, useEffect } from "react"

export function NewsTicker() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="w-full bg-background border-b border-border/50 overflow-hidden">
      <div className="py-2">
        <div className="animate-scroll whitespace-nowrap">
          <span className="nts-text-caps text-sm font-bold inline-block px-4" style={{ color: '#b12e2e' }}>
            RHYTHM LAB RADIO HAS BEEN REDEFINING THE URBAN SOUND SINCE 2005
          </span>
          <span className="text-gray-400 mx-8">•</span>
          <span className="nts-text-caps text-sm font-bold inline-block px-4" style={{ color: '#b12e2e' }}>
            RHYTHM LAB RADIO HAS BEEN REDEFINING THE URBAN SOUND SINCE 2005
          </span>
          <span className="text-gray-400 mx-8">•</span>
          <span className="nts-text-caps text-sm font-bold inline-block px-4" style={{ color: '#b12e2e' }}>
            RHYTHM LAB RADIO HAS BEEN REDEFINING THE URBAN SOUND SINCE 2005
          </span>
        </div>
      </div>
    </div>
  )
}