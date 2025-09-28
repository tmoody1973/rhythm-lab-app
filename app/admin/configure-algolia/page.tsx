'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ConfigureAlgoliaPage() {
  const [configuring, setConfiguring] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const configureAlgolia = async () => {
    setConfiguring(true)
    setStatus('idle')
    setMessage('')

    try {
      // Get the current user's session for auth
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setStatus('error')
        setMessage('You need to be logged in as an admin to configure Algolia')
        setConfiguring(false)
        return
      }

      // Call the simplified configuration endpoint (no auth needed for testing)
      const response = await fetch('/api/algolia/simple-configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Algolia index configured successfully! Date filtering is now enabled.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to configure Algolia index')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setConfiguring(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Configure Algolia Search Index</CardTitle>
                <CardDescription>
                  Set up the search index to enable date filtering and other features
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-semibold mb-2">What this does:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Enables date filtering for live songs</li>
                <li>✓ Makes timestamps searchable and filterable</li>
                <li>✓ Sets up proper search attributes</li>
                <li>✓ Configures custom ranking by recency</li>
                <li>✓ Sets up faceting for time-based fields</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You only need to do this once. After configuration,
                the date filter will work automatically on the search page.
              </p>
            </div>

            <Button
              onClick={configureAlgolia}
              disabled={configuring}
              className="w-full"
              size="lg"
            >
              {configuring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Configuring...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Algolia Index
                </>
              )}
            </Button>

            {status !== 'idle' && (
              <div
                className={`flex items-start gap-3 p-4 rounded-lg ${
                  status === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {status === 'success' ? (
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Go to the <a href="/search" className="underline font-medium">Search page</a></li>
                  <li>Select "Songs" from the filter buttons</li>
                  <li>Click on "Filter by Date" to use the date filter</li>
                  <li>Select a date range or use the quick presets</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}