import { Header } from "@/components/header"
import { RealArchiveDiscoverySection } from "@/components/real-archive-discovery-section"

export default function ArchivePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold nts-text-caps mb-2">Weekly Show</h1>
            <p className="text-muted-foreground">Discover past shows and curated music collections</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <RealArchiveDiscoverySection />
          </div>
        </div>
      </main>
    </div>
  )
}