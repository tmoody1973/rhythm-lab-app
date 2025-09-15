import { Header } from "@/components/header"
import { LiveStreamSection } from "@/components/live-stream-section"

export default function LivePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold nts-text-caps mb-2">Live Stream</h1>
            <p className="text-muted-foreground">Listen to Rhythm Lab Radio live</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <LiveStreamSection />
          </div>
        </div>
      </main>
    </div>
  )
}