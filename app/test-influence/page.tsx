"use client"

import { InfluenceGraph } from '@/components/influence-graph'

export default function TestInfluencePage() {
  // Sample track data with relationships
  const sampleTrackData = {
    track: "Lions of Juda",
    artist: "Steve Reid",
    featured_artists: ["The Legendary Master Brotherhood"],
    remixers: [],
    producers: ["Four Tet", "Madlib"],
    collaborators: ["Caribou"],
    related_artists: ["The Legendary Master Brotherhood", "Four Tet", "Madlib", "Caribou"],
    has_collaborations: true,
    collaboration_count: 4
  }

  const sampleTrackData2 = {
    track: "Only Human",
    artist: "Four Tet",
    featured_artists: ["Ellie Goulding"],
    remixers: ["Caribou", "Jamie xx"],
    producers: [],
    collaborators: ["KH"],
    related_artists: ["Ellie Goulding", "Caribou", "Jamie xx", "KH"],
    has_collaborations: true,
    collaboration_count: 4
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Artist Influence Graph Test
          </h1>
          <p className="text-gray-400 text-lg">
            Testing the relationship visualization for tracks
          </p>
        </div>

        <div className="space-y-8">
          {/* Sample Track 1 */}
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white">{sampleTrackData.track}</h2>
              <p className="text-gray-400">by {sampleTrackData.artist}</p>
            </div>
            <InfluenceGraph trackData={sampleTrackData} />
          </div>

          {/* Sample Track 2 */}
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white">{sampleTrackData2.track}</h2>
              <p className="text-gray-400">by {sampleTrackData2.artist}</p>
            </div>
            <InfluenceGraph trackData={sampleTrackData2} />
          </div>

          {/* Track without relationships */}
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white">Solo Track</h2>
              <p className="text-gray-400">by Solo Artist</p>
            </div>
            <InfluenceGraph trackData={{
              track: "Solo Track",
              artist: "Solo Artist",
              has_collaborations: false,
              collaboration_count: 0
            }} />
            <p className="text-gray-500 text-sm mt-4">
              ↑ This track has no collaborations, so no influence graph is shown
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
          <h3 className="text-xl font-bold text-purple-400 mb-4">How to Use</h3>
          <div className="text-gray-300 space-y-2">
            <p>• The influence graph only shows when <code className="bg-purple-900/50 px-2 py-1 rounded text-purple-300">has_collaborations: true</code></p>
            <p>• Click the arrow to expand and see the full network visualization</p>
            <p>• Different relationship types are color-coded (Featured, Remix, Producer, Collab)</p>
            <p>• The component automatically organizes artists by their relationship type</p>
          </div>
        </div>
      </div>
    </div>
  )
}