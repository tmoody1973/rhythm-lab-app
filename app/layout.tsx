import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { PersistentAudioPlayer } from "@/components/persistent-audio-player"
import { AuthProvider } from "@/lib/auth/context"
import { RadioProvider } from "@/lib/radio/context"

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
        <AuthProvider>
          <RadioProvider>
            <Suspense fallback={null}>{children}</Suspense>
            <PersistentAudioPlayer />
          </RadioProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
