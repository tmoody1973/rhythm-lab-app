import React from 'react'
import { Metadata } from 'next'
import { Search } from 'lucide-react'
import { Header } from '@/components/header'
import { ImprovedSearchInterface } from '@/components/algolia/improved-search-interface'

export const metadata: Metadata = {
  title: 'Search - Rhythm Lab Radio',
  description: 'Search for songs, shows, artists, and content across Rhythm Lab Radio',
}

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const initialQuery = typeof params.q === 'string' ? params.q : ''
  const initialType = typeof params.type === 'string' ? params.type : 'all'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 pb-24">
            {/* Page Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-foreground">
                  Search Rhythm Lab
                </h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover tracks, shows, artist profiles, and AI-generated content from your favorite electronic music platform
              </p>
            </div>

            {/* Search Interface */}
            <ImprovedSearchInterface
              initialQuery={initialQuery}
              initialSearchType={initialType}
            />
        </div>
      </main>
    </div>
  )
}