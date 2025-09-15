import { Header } from "@/components/header"
import { LiveStreamSection } from "@/components/live-stream-section"
import { AIContentFeed } from "@/components/ai-content-feed"
import { ArchiveDiscoverySection } from "@/components/archive-discovery-section"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 py-8 pb-24">
          <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <LiveStreamSection />
            </div>

            <div className="lg:col-span-1 lg:border-l lg:border-border/30 lg:pl-6">
              <AIContentFeed />
            </div>

            <div className="lg:col-span-1 lg:border-l lg:border-border/30 lg:pl-6">
              <ArchiveDiscoverySection />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
