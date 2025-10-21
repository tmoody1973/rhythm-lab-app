import type React from "react"
import type { Metadata } from "next"
import { Inter, Outfit } from "next/font/google"
import { Suspense } from "react"
import Script from "next/script"
import "./globals.css"
import { PersistentAudioPlayer } from "@/components/persistent-audio-player"
import { UnifiedPersistentPlayer } from "@/components/unified-persistent-player"
import MobileNavigationWrapper from "@/components/mobile-navigation-wrapper"
import { RadioProvider } from "@/lib/radio/context"
import { UnifiedPlayerProvider } from "@/lib/audio/unified-player-context"
import { AuthProvider } from "@/contexts/auth-context"
import { ClerkAuthProvider } from "@/contexts/clerk-auth-context"
import { Databuddy } from '@databuddy/sdk'
import { C1ThemeProvider } from '@/components/providers/C1ThemeProvider'

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
})

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "Rhythm Lab Radio",
  description: "AI Music Discovery Platform",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.databuddy.cc/databuddy.js"
          data-client-id="UCDi6utgTgVm6zH5yBl-W"
          data-track-hash-changes="true"
          data-track-outgoing-links="true"
          data-track-interactions="true"
          data-track-engagement="true"
          data-track-scroll-depth="true"
          data-track-bounce-rate="true"
          data-track-web-vitals="true"
          data-track-errors="true"
          data-enable-batching="true"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`font-sans ${inter.variable} ${outfit.variable} antialiased`}>
        <ClerkAuthProvider>
          <RadioProvider>
            <UnifiedPlayerProvider>
              <C1ThemeProvider>
                <Suspense fallback={null}>{children}</Suspense>
                <PersistentAudioPlayer />
                <UnifiedPersistentPlayer />
                <MobileNavigationWrapper />
                <Databuddy
                  clientId="UCDi6utgTgVm6zH5yBl-W"
                  trackOutgoingLinks={true}
                  trackInteractions={true}
                  trackEngagement={true}
                  trackScrollDepth={true}
                  trackExitIntent={true}
                  trackBounceRate={true}
                  trackWebVitals={true}
                  trackErrors={true}
                  enableBatching={true}
                />
              </C1ThemeProvider>
            </UnifiedPlayerProvider>
          </RadioProvider>
        </ClerkAuthProvider>
      </body>
    </html>
  )
}
