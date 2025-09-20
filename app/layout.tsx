import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { PersistentAudioPlayer } from "@/components/persistent-audio-player"
import { RadioProvider } from "@/lib/radio/context"
import { AuthProvider } from "@/contexts/auth-context"
import { ClerkAuthProvider } from "@/contexts/clerk-auth-context"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
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
      <body className={`font-sans ${inter.variable} antialiased`}>
        <ClerkAuthProvider>
          <RadioProvider>
            <Suspense fallback={null}>{children}</Suspense>
            <PersistentAudioPlayer />
          </RadioProvider>
        </ClerkAuthProvider>
      </body>
    </html>
  )
}
