import { Header } from '@/components/header'
import { ChatContainer } from '@/components/ai-chat/ChatContainer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Music Discovery AI | Rhythm Lab Radio',
  description: 'Discover amazing music through AI-powered conversations. Find artists, explore genres, and get personalized recommendations.',
}

export default function AIChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold nts-text-caps mb-3">
            Music Discovery AI
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Chat with our AI to discover amazing artists, explore genres, and find the perfect music for any mood.
            Powered by Thesys C1.
          </p>
        </div>

        {/* Chat Interface */}
        <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
          <ChatContainer />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-2">🎯 Smart Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              Get personalized artist recommendations based on genre, mood, or style
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-2">🔍 Deep Exploration</h3>
            <p className="text-sm text-muted-foreground">
              Discover similar artists, explore discographies, and learn music history
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-2">🎨 Interactive UI</h3>
            <p className="text-sm text-muted-foreground">
              Beautiful, clickable artist cards and playlists generated in real-time
            </p>
          </div>
        </div>

        {/* Beta Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            <strong>Beta Feature:</strong> This AI assistant is powered by Thesys C1 and continuously learning.
            Responses may vary. For best results, try being specific about genres or moods.
          </p>
        </div>
      </main>
    </div>
  )
}
