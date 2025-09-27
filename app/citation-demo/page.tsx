import { EnhancedCitationDisplay } from '@/components/enhanced-citation-display'
import { Header } from '@/components/header'

// Sample content with sources
const sampleContent = `Jazz Is Dead represents a groundbreaking approach to musical preservation and innovation, breathing new life into classic jazz compositions while honoring their original creators. This synthesis of passion, authenticity, and innovation positions Jazz Is Dead as a crucial force in the cultural revitalization of jazz.

The collaborative project has garnered significant attention for its unique approach to reimagining jazz classics, working with legendary artists and emerging talents alike to create something entirely new while respecting the source material.`

const sampleSources = [
  {
    title: "We Just Got To Do This: Adrian Younge talks uplifting legends with Jazz Is Dead",
    url: "https://www.redbull.com/us-en/adrian-younge-jazz-is-dead-interview",
    author: "Red Bull Music",
    date: "2024-03-15",
    type: "article"
  },
  {
    title: "Jazz Is Dead: Long Live Jazz! - DownBeat",
    url: "https://downbeat.com/reviews/detail/jazz-is-dead-long-live-jazz",
    author: "DownBeat Magazine",
    date: "2024-02-20",
    type: "article"
  },
  {
    title: "Jazz Is Dead Brings L.A. The Musical Legends That Your Favorite Artists Sample",
    url: "https://www.laweekly.com/jazz-is-dead-brings-la-the-musical-legends/",
    author: "LA Weekly",
    date: "2024-01-18",
    type: "article"
  },
  {
    title: "Jazz Is Dead | The Ford",
    url: "https://www.theford.com/events/detail/jazz-is-dead",
    author: "The Ford Theatre",
    date: "2024-03-01",
    type: "website"
  },
  {
    title: "Jazz is Dead | Adrian Younge and Ali Shaheed Muhammad",
    url: "https://www.youtube.com/watch?v=example123",
    author: "YouTube",
    date: "2024-02-10",
    type: "video"
  },
  {
    title: "Jazz Is Dead: In Conversation with Adrian Younge and Ali Shaheed",
    url: "https://open.spotify.com/episode/example456",
    author: "Spotify Podcasts",
    date: "2024-01-25",
    type: "podcast"
  },
  {
    title: "ABOUT - JAZZ IS DEAD",
    url: "https://jazzisdead.co/about",
    author: "Jazz Is Dead Official",
    date: "2024-03-20",
    type: "website"
  },
  {
    title: "JAZZ IS DEAD",
    url: "https://twitter.com/jazzisdead",
    author: "Jazz Is Dead",
    date: "2024-03-25",
    type: "social"
  }
]

export default function CitationDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-4">Enhanced Citation Display - Demo</h1>
          <p className="text-gray-600">
            Showcasing different display modes for sources and references that work well across various content types.
          </p>
        </div>

        <div className="space-y-16">
          {/* Full Display Mode */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">Full Display Mode</h2>
            <p className="text-gray-600 mb-6">
              Best for: Long-form articles, research pieces, academic content
            </p>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <EnhancedCitationDisplay
                content={sampleContent}
                searchResults={sampleSources}
                displayMode="full"
                maxVisible={3}
                autoCollapse={true}
              />
            </div>
          </section>

          {/* Compact Display Mode */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-green-600">Compact Display Mode</h2>
            <p className="text-gray-600 mb-6">
              Best for: Blog posts, news articles, medium-length content
            </p>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <EnhancedCitationDisplay
                content={sampleContent}
                searchResults={sampleSources}
                displayMode="compact"
                maxVisible={4}
                autoCollapse={true}
              />
            </div>
          </section>

          {/* Grid Display Mode */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-600">Grid Display Mode</h2>
            <p className="text-gray-600 mb-6">
              Best for: Visual browsing, resource collections, curated lists
            </p>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <EnhancedCitationDisplay
                content={sampleContent}
                searchResults={sampleSources}
                displayMode="grid"
                maxVisible={6}
                autoCollapse={false}
              />
            </div>
          </section>

          {/* Minimal Display Mode */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-orange-600">Minimal Display Mode</h2>
            <p className="text-gray-600 mb-6">
              Best for: Quick references, social media posts, mobile-first content
            </p>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <EnhancedCitationDisplay
                content={sampleContent}
                searchResults={sampleSources}
                displayMode="minimal"
                autoCollapse={false}
              />
            </div>
          </section>

          {/* Usage Examples */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Usage Examples</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-3">How to integrate:</h3>
              <pre className="text-sm bg-white p-4 rounded border overflow-x-auto">
{`import { EnhancedCitationDisplay } from '@/components/enhanced-citation-display'

// For blog posts
<EnhancedCitationDisplay
  content={content}
  searchResults={sources}
  displayMode="compact"
  maxVisible={5}
  autoCollapse={true}
/>

// For academic articles
<EnhancedCitationDisplay
  content={content}
  searchResults={sources}
  displayMode="full"
  autoCollapse={false}
/>

// For mobile or social
<EnhancedCitationDisplay
  content={content}
  searchResults={sources}
  displayMode="minimal"
/>`}
              </pre>
            </div>
          </section>

          {/* Features List */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium mb-3">Visual Enhancements</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Source type icons (📰 articles, 🎥 videos, 🎵 podcasts)</li>
                  <li>• Domain extraction and display</li>
                  <li>• Hover effects and transitions</li>
                  <li>• Color-coded layouts</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium mb-3">Functionality</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Auto-collapse for long lists</li>
                  <li>• Multiple display modes</li>
                  <li>• Source type detection</li>
                  <li>• External link handling</li>
                  <li>• Mobile-optimized layouts</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}