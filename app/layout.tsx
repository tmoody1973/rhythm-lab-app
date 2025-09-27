import type React from "react"
import type { Metadata } from "next"
import { Inter, Outfit } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { PersistentAudioPlayer } from "@/components/persistent-audio-player"
import { UnifiedPersistentPlayer } from "@/components/unified-persistent-player"
import { RadioProvider } from "@/lib/radio/context"
import { UnifiedPlayerProvider } from "@/lib/audio/unified-player-context"
import { AuthProvider } from "@/contexts/auth-context"
import { ClerkAuthProvider } from "@/contexts/clerk-auth-context"

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
      <body className={`font-sans ${inter.variable} ${outfit.variable} antialiased`}>
        <ClerkAuthProvider>
          <RadioProvider>
            <UnifiedPlayerProvider>
              <Suspense fallback={null}>{children}</Suspense>
              <PersistentAudioPlayer />
              <UnifiedPersistentPlayer />
            </UnifiedPlayerProvider>
          </RadioProvider>
        </ClerkAuthProvider>
      </body>
    </html>
  )
}
