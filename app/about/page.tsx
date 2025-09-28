import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | Rhythm Lab Radio',
  description: 'Discover the story behind Rhythm Lab Radio - a platform dedicated to showcasing electronic music, deep house, ambient, jazz fusion, and experimental sounds from around the world.',
  openGraph: {
    title: 'About Rhythm Lab Radio',
    description: 'Discover the story behind Rhythm Lab Radio - a platform dedicated to showcasing electronic music from around the world.',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="py-12 md:py-16">
          <div className="text-center space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground uppercase tracking-wide">
              ABOUT RHYTHM LAB RADIO
            </h1>
            <p className="text-lg md:text-xl text-foreground/90 max-w-4xl mx-auto leading-relaxed">
              A global platform for urban music discovery, featuring the spectrum of Hip Hop, Jazz, Electronic, R&B
              and beyond from artists around the world.
            </p>
          </div>
        </section>

        {/* Large Hero Image */}
        <section className="py-12">
          <div className="aspect-[21/9] bg-gradient-to-r from-purple-900/80 to-blue-900/80 relative overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-black/50"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-wide mb-4">ELECTRONIC MUSIC DISCOVERY</h2>
                <p className="text-lg md:text-xl max-w-2xl mx-auto">Connecting underground scenes with global audiences</p>
              </div>
            </div>
            {/* Placeholder for actual image */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20"></div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-12">
          <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground uppercase tracking-wide">OUR MISSION</h2>
              <Badge className="bg-[#8b5cf6] text-white text-sm px-4 py-2 rounded-full font-medium">
                CORE VALUES
              </Badge>
            </div>
            <div className="space-y-4 text-base leading-relaxed text-foreground/90">
              <p>
                Rhythm Lab Radio exists to bridge the gap between underground urban music scenes
                and global audiences seeking authentic, cutting-edge sounds.
              </p>
              <p>
                We curate a carefully selected journey through the spectrum of urban music - Hip Hop, Jazz, Electronic, R&B and beyond,
                from innovative beats that move bodies to soulful sounds that move minds.
              </p>
            </div>
          </div>
        </section>

        {/* What We Do Section */}
        <section className="py-12 space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-foreground uppercase tracking-wide mb-4">WHAT WE DO</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium uppercase tracking-widest text-foreground">LIVE RADIO</h3>
                <Badge className="bg-[#b12e2e] text-white text-sm px-3 py-1 rounded-full font-medium">
                  24/7
                </Badge>
              </div>
              <p className="text-base leading-relaxed text-foreground/90">
                Continuous live streaming featuring carefully curated urban music from emerging and established artists worldwide - Hip Hop, Jazz, Electronic, R&B and beyond.
              </p>
            </div>
            <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium uppercase tracking-widest text-foreground">DEEP DIVES</h3>
                <Badge className="bg-[#8b5cf6] text-white text-sm px-3 py-1 rounded-full font-medium">
                  PODCAST
                </Badge>
              </div>
              <p className="text-base leading-relaxed text-foreground/90">
                In-depth explorations of genres, artists, and movements that shape the urban music landscape - Hip Hop, Jazz, Electronic, R&B and beyond.
              </p>
            </div>
            <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium uppercase tracking-widest text-foreground">ARTIST PROFILES</h3>
                <Badge className="bg-[#10b981] text-white text-sm px-3 py-1 rounded-full font-medium">
                  FEATURES
                </Badge>
              </div>
              <p className="text-base leading-relaxed text-foreground/90">
                Showcasing the stories and sounds of urban music innovators from every corner of the globe - Hip Hop, Jazz, Electronic, R&B and beyond.
              </p>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="py-12">
          <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground uppercase tracking-wide">OUR PHILOSOPHY</h2>
              <Badge className="bg-[#f59e0b] text-white text-sm px-4 py-2 rounded-full font-medium">
                GLOBAL
              </Badge>
            </div>
            <div className="space-y-4 text-base leading-relaxed text-foreground/90">
              <p>
                Music has no borders. Our programming celebrates this fundamental truth by showcasing
                urban music that transcends geographical and cultural boundaries.
              </p>
              <p>
                We believe in supporting independent artists, promoting musical diversity, and creating
                connections between listeners and the vibrant communities that create Hip Hop, Jazz, Electronic, R&B and beyond.
              </p>
              <p>
                Every track we play, every artist we feature, and every story we tell is chosen to
                expand minds and move bodies.
              </p>
            </div>
          </div>
        </section>

        {/* Large Community Image */}
        <section className="py-12">
          <div className="aspect-[21/9] bg-gradient-to-r from-orange-900/80 to-red-900/80 relative overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-wide mb-4">GLOBAL COMMUNITY</h2>
                <p className="text-lg md:text-xl max-w-2xl mx-auto">Artists and listeners united by electronic music</p>
              </div>
            </div>
            {/* Placeholder for actual image */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-red-600/20"></div>
          </div>
        </section>

        {/* Community Section */}
        <section className="py-12 space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-foreground uppercase tracking-wide mb-4">JOIN OUR COMMUNITY</h2>
            <p className="text-base text-foreground/90 max-w-2xl mx-auto">
              Rhythm Lab Radio is more than a radio station—it's a global community of urban music enthusiasts connected by Hip Hop, Jazz, Electronic, R&B and beyond.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium uppercase tracking-widest text-foreground">LISTEN & DISCOVER</h3>
                <Badge className="bg-[#b12e2e] text-white text-sm px-3 py-1 rounded-full font-medium">
                  LIVE
                </Badge>
              </div>
              <p className="text-base leading-relaxed text-foreground/90 mb-4">
                Tune in to our 24/7 live stream and discover your next favorite track. Every listen supports independent urban music.
              </p>
              <Link href="/live">
                <Button className="w-full bg-[#b12e2e] hover:bg-[#8e2424] text-white">
                  Start Listening
                </Button>
              </Link>
            </div>
            <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium uppercase tracking-widest text-foreground">STAY CONNECTED</h3>
                <Badge className="bg-[#8b5cf6] text-white text-sm px-3 py-1 rounded-full font-medium">
                  UPDATES
                </Badge>
              </div>
              <p className="text-base leading-relaxed text-foreground/90 mb-4">
                Subscribe to our newsletter for exclusive content, artist interviews, and first access to new shows.
              </p>
              <Button className="w-full" variant="outline">
                Subscribe to Newsletter
              </Button>
            </div>
          </div>
        </section>

        {/* Host Section */}
        <section className="py-12">
          <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-8 space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-foreground uppercase tracking-wide mb-4">ABOUT THE HOST</h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-center">
              {/* Host Photo */}
              <div className="lg:col-span-1">
                <div className="aspect-square bg-muted/20 border-2 border-border/30 rounded-xl flex items-center justify-center p-8 hover:bg-muted/30 transition-colors">
                  <div className="text-center">
                    <div className="text-lg font-bold text-muted-foreground">TARIK MOODY</div>
                    <div className="text-sm text-muted-foreground">HOST PHOTO</div>
                  </div>
                </div>
              </div>

              {/* Host Bio */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Tarik Moody</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-[#b12e2e] text-white text-sm px-3 py-1 rounded-full font-medium">
                      HOST
                    </Badge>
                    <span className="text-sm text-muted-foreground font-medium">Rhythm Lab Radio from 88Nine Radio Milwaukee</span>
                  </div>
                </div>

                <div className="space-y-4 text-base leading-relaxed text-foreground/90">
                  <p>
                    Tarik Moody, a graduate of Howard University in Washington D.C., got his first taste of the music industry back in the mid 90s as an intern for cable access music video show, "Sonic Ignition" in Washington D.C. He met and talked to artists such as Chuck D from Public Enemy, Republica and Cypress Hill.
                  </p>
                  <p>
                    Tarik moved to Minneapolis in 1998 and started volunteering at the local non-commercial radio station KFAI-FM in 1999. Eventually, he connected with DJ Jennifer and became co-host of the station's long-running show, "Groove Garden." In 2003, he became one of four hosts for KFAI's "Local Sound Department." Two years later, he started hosting his own radio show called Rhythm Lab Radio on Minnesota Public Radio.
                  </p>
                  <p>
                    Then, in 2006, he was approached by 88Nine Radio Milwaukee to bring his talents to the new station. Formerly an architect, Tarik made the professional leap to radio and now works as the station's Director of Digital Strategy and Innovation, and evening music host.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Stations Section */}
        <section className="py-12">
          <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-8 space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-foreground uppercase tracking-wide mb-4">OUR PARTNER STATIONS</h2>
              <p className="text-base text-foreground/90 max-w-2xl mx-auto">
                Rhythm Lab Radio's weekly show airs on these amazing radio stations around the world
              </p>
            </div>

            {/* Station Logos Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
              {/* Placeholder for station logos - replace with actual logos */}
              <div className="aspect-square bg-muted/20 border border-border/30 rounded-lg flex items-center justify-center p-4 hover:bg-muted/30 transition-colors">
                <div className="text-center">
                  <div className="text-sm font-bold text-muted-foreground">STATION</div>
                  <div className="text-xs text-muted-foreground">LOGO</div>
                </div>
              </div>
              <div className="aspect-square bg-muted/20 border border-border/30 rounded-lg flex items-center justify-center p-4 hover:bg-muted/30 transition-colors">
                <div className="text-center">
                  <div className="text-sm font-bold text-muted-foreground">STATION</div>
                  <div className="text-xs text-muted-foreground">LOGO</div>
                </div>
              </div>
              <div className="aspect-square bg-muted/20 border border-border/30 rounded-lg flex items-center justify-center p-4 hover:bg-muted/30 transition-colors">
                <div className="text-center">
                  <div className="text-sm font-bold text-muted-foreground">STATION</div>
                  <div className="text-xs text-muted-foreground">LOGO</div>
                </div>
              </div>
              <div className="aspect-square bg-muted/20 border border-border/30 rounded-lg flex items-center justify-center p-4 hover:bg-muted/30 transition-colors">
                <div className="text-center">
                  <div className="text-sm font-bold text-muted-foreground">STATION</div>
                  <div className="text-xs text-muted-foreground">LOGO</div>
                </div>
              </div>
              <div className="aspect-square bg-muted/20 border border-border/30 rounded-lg flex items-center justify-center p-4 hover:bg-muted/30 transition-colors">
                <div className="text-center">
                  <div className="text-sm font-bold text-muted-foreground">STATION</div>
                  <div className="text-xs text-muted-foreground">LOGO</div>
                </div>
              </div>
              <div className="aspect-square bg-muted/20 border border-border/30 rounded-lg flex items-center justify-center p-4 hover:bg-muted/30 transition-colors">
                <div className="text-center">
                  <div className="text-sm font-bold text-muted-foreground">STATION</div>
                  <div className="text-xs text-muted-foreground">LOGO</div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-foreground/70">
                Want to air Rhythm Lab Radio on your station?
                <a href="mailto:partners@rhythmlabradio.com" className="text-foreground hover:text-foreground/70 transition-colors font-medium ml-1">
                  Get in touch
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12">
          <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-8 space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-foreground uppercase tracking-wide mb-4">GET IN TOUCH</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-3">
                <Badge className="bg-[#ef4444] text-white text-sm px-4 py-2 rounded-full font-medium">
                  SUBMISSIONS
                </Badge>
                <p className="text-sm text-foreground/90">
                  Share your music with our programming team
                </p>
                <a href="mailto:music@rhythmlabradio.com" className="text-foreground hover:text-foreground/70 transition-colors text-sm font-medium block">
                  music@rhythmlabradio.com
                </a>
              </div>
              <div className="text-center space-y-3">
                <Badge className="bg-[#10b981] text-white text-sm px-4 py-2 rounded-full font-medium">
                  PARTNERSHIPS
                </Badge>
                <p className="text-sm text-foreground/90">
                  Collaborate with Rhythm Lab Radio
                </p>
                <a href="mailto:partners@rhythmlabradio.com" className="text-foreground hover:text-foreground/70 transition-colors text-sm font-medium block">
                  partners@rhythmlabradio.com
                </a>
              </div>
              <div className="text-center space-y-3">
                <Badge className="bg-[#f59e0b] text-white text-sm px-4 py-2 rounded-full font-medium">
                  GENERAL
                </Badge>
                <p className="text-sm text-foreground/90">
                  Questions, feedback, and everything else
                </p>
                <a href="mailto:hello@rhythmlabradio.com" className="text-foreground hover:text-foreground/70 transition-colors text-sm font-medium block">
                  hello@rhythmlabradio.com
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-12 pb-24">
          <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-8 text-center space-y-6">
            <h2 className="text-xl font-bold text-foreground uppercase tracking-wide">
              Ready to explore?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/live">
                <Button size="lg" className="bg-[#b12e2e] hover:bg-[#8e2424] text-white">
                  Listen Live
                </Button>
              </Link>
              <Link href="/deep-dives">
                <Button size="lg" variant="outline" className="border-2 border-foreground/20 text-foreground hover:bg-foreground hover:text-background">
                  Explore Deep Dives
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}