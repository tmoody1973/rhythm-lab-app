"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { parsePlaylistText, generateParseSummary } from '@/lib/playlist-parser'

export function PlaylistParserTest() {
  const [playlistText, setPlaylistText] = useState(`HOUR 1
Bonobo - Black Sands
Thievery Corporation - Lebanese Blonde
Nujabes - Aruarian Dance

HOUR 2
RJD2 - Ghostwriter
Blockhead - The Music Scene
Prefuse 73 - One Word Extinguisher`)

  const [result, setResult] = useState(null)

  const handleParse = () => {
    const parseResult = parsePlaylistText(playlistText)
    setResult(parseResult)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Playlist Parser Test</CardTitle>
          <CardDescription>
            Test the playlist parser with your own data. Paste your playlist below and click "Parse".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Playlist Text:</label>
            <Textarea
              value={playlistText}
              onChange={(e) => setPlaylistText(e.target.value)}
              placeholder="Paste your playlist here..."
              rows={10}
              className="mt-1"
            />
          </div>

          <Button onClick={handleParse} className="w-full">
            Parse Playlist
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Parse Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <pre className="text-sm">{generateParseSummary(result)}</pre>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-600 mb-2">Errors:</h4>
                {result.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded mb-1">
                    {error}
                  </div>
                ))}
              </div>
            )}

            {result.warnings.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-2">Warnings:</h4>
                {result.warnings.map((warning, index) => (
                  <div key={index} className="text-sm text-orange-600 bg-orange-50 p-2 rounded mb-1">
                    {warning}
                  </div>
                ))}
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold mb-2">Parsed Tracks:</h4>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {result.tracks.map((track, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                    <Badge variant="outline" className="text-xs">
                      {track.position}
                    </Badge>
                    {track.hour && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        H{track.hour}
                      </Badge>
                    )}
                    <span className="font-medium">{track.artist}</span>
                    <span className="text-muted-foreground">-</span>
                    <span>{track.track}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}