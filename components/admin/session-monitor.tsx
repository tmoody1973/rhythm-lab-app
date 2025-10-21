"use client"

import { useUser, useClerk } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

interface SessionInfo {
  lastRefresh: Date
  status: 'active' | 'refreshing' | 'error'
  errorMessage?: string
}

export function SessionMonitor() {
  const { isSignedIn, user } = useUser()
  const { session } = useClerk()
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    lastRefresh: new Date(),
    status: 'active'
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isSignedIn || !session) return

    // Monitor session refresh events
    const interval = setInterval(() => {
      setSessionInfo(prev => ({
        ...prev,
        lastRefresh: new Date(),
        status: 'active'
      }))
    }, 5 * 60 * 1000) // Update every 5 minutes when session is touched

    return () => clearInterval(interval)
  }, [isSignedIn, session])

  // Toggle visibility with keyboard shortcut (Cmd/Ctrl + Shift + S)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!isVisible || !isSignedIn) return null

  const minutesSinceRefresh = Math.floor(
    (new Date().getTime() - sessionInfo.lastRefresh.getTime()) / (1000 * 60)
  )

  return (
    <Card className="fixed bottom-4 right-4 p-4 bg-white shadow-lg border-2 border-blue-200 z-50 max-w-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Session Monitor</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${
              sessionInfo.status === 'active' ? 'text-green-600' :
              sessionInfo.status === 'refreshing' ? 'text-blue-600' :
              'text-red-600'
            }`}>
              {sessionInfo.status}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">User:</span>
            <span className="font-medium truncate ml-2">
              {user?.username || user?.emailAddresses[0]?.emailAddress}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Last Refresh:</span>
            <span className="font-medium">{minutesSinceRefresh}m ago</span>
          </div>

          {sessionInfo.errorMessage && (
            <div className="mt-2 p-2 bg-red-50 rounded text-red-700">
              {sessionInfo.errorMessage}
            </div>
          )}

          <div className="mt-3 pt-2 border-t text-gray-500">
            Press <kbd className="px-1 bg-gray-100 rounded">Cmd/Ctrl+Shift+S</kbd> to toggle
          </div>
        </div>
      </div>
    </Card>
  )
}
