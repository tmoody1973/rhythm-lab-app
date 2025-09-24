"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Clock,
  User,
  Key
} from 'lucide-react'

interface ConnectionStatus {
  connected: boolean
  user_id: string
  mixcloud_username?: string
  expires_at?: string
  scope?: string
  userInfo?: any
  message: string
  error?: string
}

export function MixcloudConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  const checkStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/mixcloud/status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to check connection status:', error)
      setStatus({
        connected: false,
        user_id: '',
        message: 'Failed to check connection status',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    window.location.href = '/api/auth/mixcloud/authorize'
  }

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true)
      const response = await fetch('/api/auth/mixcloud/disconnect', {
        method: 'POST'
      })

      if (response.ok) {
        await checkStatus() // Refresh status
      } else {
        console.error('Failed to disconnect')
      }
    } catch (error) {
      console.error('Disconnect error:', error)
    } finally {
      setDisconnecting(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  if (loading) {
    return (
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Checking Mixcloud Connection...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={`border-2 ${status?.connected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status?.connected ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            Mixcloud Connection
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkStatus}
              disabled={loading}
              className="border-amber-300 hover:bg-amber-100"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          {status?.message || 'No connection information available'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status Badge */}
        <div className="flex items-center gap-2">
          <Badge variant={status?.connected ? "default" : "destructive"} className="px-3 py-1">
            {status?.connected ? "Connected" : "Disconnected"}
          </Badge>
          {status?.scope && (
            <Badge variant="secondary" className="px-3 py-1">
              <Key className="h-3 w-3 mr-1" />
              {status.scope}
            </Badge>
          )}
        </div>

        {/* Connection Details */}
        {status?.connected && (
          <div className="space-y-2 text-sm">
            {status.mixcloud_username && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>Connected as: <strong>{status.mixcloud_username}</strong></span>
                {status.userInfo?.url && (
                  <a
                    href={status.userInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-800"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {status.expires_at && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>Token expires: {new Date(status.expires_at).toLocaleString()}</span>
                {new Date(status.expires_at).getTime() < Date.now() + (24 * 60 * 60 * 1000) && (
                  <span title="Token expires soon">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </span>
                )}
              </div>
            )}

            {status.userInfo && (
              <div className="text-xs text-gray-600 mt-2">
                <strong>User Profile:</strong> {status.userInfo.name}
                <br />
                <strong>Shows:</strong> {status.userInfo.cloudcast_count || 0}
                <br />
                <strong>Followers:</strong> {status.userInfo.follower_count || 0}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {status?.connected ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-2"
            >
              {disconnecting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
            >
              <ExternalLink className="h-4 w-4" />
              Connect to Mixcloud
            </Button>
          )}
        </div>

        {/* Error Display */}
        {status?.error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {status.error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}