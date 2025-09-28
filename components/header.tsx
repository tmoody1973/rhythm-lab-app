"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SearchModal } from "@/components/search-modal"
import { NewsTicker } from "@/components/news-ticker"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import Image from "next/image"
import { useUser, SignOutButton } from "@clerk/nextjs"

export function Header() {
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, isLoaded } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/rlr-selector-logo.png"
                  alt="Rhythm Lab Radio"
                  width={192}
                  height={64}
                  className="h-12 w-auto sm:h-16"
                  priority
                />
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" >
                <Button
                  variant="ghost"
                  className="nts-text-caps text-sm font-bold hover:bg-transparent hover:text-gray-700 px-0 text-black"
                  style={{ color: "#000000" }}
                >
                  HOME
                </Button>
              </Link>
              <Link href="/live" >
                <Button
                  variant="ghost"
                  className="nts-text-caps text-sm font-bold hover:bg-transparent hover:text-gray-700 px-0 text-black"
                  style={{ color: "#000000" }}
                >
                  LIVE
                </Button>
              </Link>
              <Link href="/blog" >
                <Button
                  variant="ghost"
                  className="nts-text-caps text-sm font-bold hover:bg-transparent hover:text-gray-700 px-0 text-black"
                  style={{ color: "#000000" }}
                >
                  BLOG
                </Button>
              </Link>
              <Link href="/deep-dives" >
                <Button
                  variant="ghost"
                  className="nts-text-caps text-sm font-bold hover:bg-transparent hover:text-gray-700 px-0 text-black"
                  style={{ color: "#000000" }}
                >
                  DEEP DIVES
                </Button>
              </Link>
              <Link href="/profiles" >
                <Button
                  variant="ghost"
                  className="nts-text-caps text-sm font-bold hover:bg-transparent hover:text-gray-700 px-0 text-black"
                  style={{ color: "#000000" }}
                >
                  PROFILES
                </Button>
              </Link>
              <Link href="/about" >
                <Button
                  variant="ghost"
                  className="nts-text-caps text-sm font-bold hover:bg-transparent hover:text-gray-700 px-0 text-black"
                  style={{ color: "#000000" }}
                >
                  ABOUT
                </Button>
              </Link>
              <Link href="/archive" >
                <Button
                  variant="ghost"
                  className="nts-text-caps text-sm font-bold hover:bg-transparent hover:text-gray-700 px-0 text-black"
                  style={{ color: "#000000" }}
                >
                  WEEKLY SHOW
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="nts-text-caps text-sm font-bold hover:bg-transparent hover:text-gray-700 px-0 text-black"
                style={{ color: "#000000" }}
                onClick={() => setSearchModalOpen(true)}
              >
                SEARCH
              </Button>
            </nav>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-transparent"
                onClick={() => setSearchModalOpen(true)}
              >
                <span className="text-lg">🔍</span>
              </Button>


              {/* Auth buttons for desktop */}
              <div className="hidden md:flex items-center gap-3">
                {!mounted || !isLoaded ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : user ? (
                  <div className="flex items-center gap-3">
                    <Link href="/profile">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-foreground/20 text-foreground hover:bg-foreground hover:text-background text-sm px-4 py-2"
                      >
                        Profile
                      </Button>
                    </Link>
                    <SignOutButton>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-foreground hover:bg-foreground/10 text-sm px-4 py-2"
                      >
                        Sign Out
                      </Button>
                    </SignOutButton>
                  </div>
                ) : (
                  <>
                    <Link href="/sign-in">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-foreground/20 text-foreground hover:bg-foreground hover:text-background text-sm px-4 py-2"
                      >
                        Log In
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button
                        size="sm"
                        className="bg-foreground text-background hover:bg-foreground/90 text-sm px-4 py-2"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100 transition-colors">
                      <span className="text-xl">☰</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-white border-l border-border/20 shadow-2xl w-80 p-0">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <div className="flex flex-col h-full">
                      {/* Header */}
                      <div className="p-6 border-b border-border/20">
                        <h2 className="text-lg font-bold text-foreground tracking-wide">NAVIGATION</h2>
                      </div>

                      {/* Navigation Links */}
                      <nav className="flex-1 px-4 py-6 space-y-2">
                        <Link href="/" className="block p-4 rounded-xl transition-all duration-200 hover:bg-gray-50 active:scale-95 group">
                          <span className="nts-text-caps text-base font-bold text-foreground group-hover:text-gray-700">HOME</span>
                        </Link>

                        <Link href="/live" className="block p-4 rounded-xl transition-all duration-200 hover:bg-gray-50 active:scale-95 group">
                          <span className="nts-text-caps text-base font-bold text-foreground group-hover:text-gray-700">LIVE</span>
                        </Link>

                        <Link href="/blog" className="block p-4 rounded-xl transition-all duration-200 hover:bg-gray-50 active:scale-95 group">
                          <span className="nts-text-caps text-base font-bold text-foreground group-hover:text-gray-700">BLOG</span>
                        </Link>

                        <Link href="/deep-dives" className="block p-4 rounded-xl transition-all duration-200 hover:bg-gray-50 active:scale-95 group">
                          <span className="nts-text-caps text-base font-bold text-foreground group-hover:text-gray-700">DEEP DIVES</span>
                        </Link>

                        <Link href="/profiles" className="block p-4 rounded-xl transition-all duration-200 hover:bg-gray-50 active:scale-95 group">
                          <span className="nts-text-caps text-base font-bold text-foreground group-hover:text-gray-700">PROFILES</span>
                        </Link>

                        <Link href="/about" className="block p-4 rounded-xl transition-all duration-200 hover:bg-gray-50 active:scale-95 group">
                          <span className="nts-text-caps text-base font-bold text-foreground group-hover:text-gray-700">ABOUT</span>
                        </Link>

                        <Link href="/archive" className="block p-4 rounded-xl transition-all duration-200 hover:bg-gray-50 active:scale-95 group">
                          <span className="nts-text-caps text-base font-bold text-foreground group-hover:text-gray-700">WEEKLY SHOW</span>
                        </Link>

                        <button
                          onClick={() => setSearchModalOpen(true)}
                          className="block p-4 rounded-xl transition-all duration-200 hover:bg-gray-50 active:scale-95 group w-full text-left"
                        >
                          <span className="nts-text-caps text-base font-bold text-foreground group-hover:text-gray-700">SEARCH</span>
                        </button>
                      </nav>

                      {/* Auth Section */}
                      <div className="border-t border-border/20 p-6 bg-gray-50/50">
                        <div className="space-y-3">
                          {!mounted || !isLoaded ? (
                            <div className="text-center py-4">
                              <div className="text-sm text-muted-foreground">Loading...</div>
                            </div>
                          ) : user ? (
                            <>
                              <Link href="/profile" className="block">
                                <Button
                                  variant="outline"
                                  size="lg"
                                  className="w-full h-12 text-base font-medium border-2 border-foreground/20 text-foreground hover:bg-foreground hover:text-background transition-all duration-200"
                                >
                                  Profile
                                </Button>
                              </Link>
                              <SignOutButton>
                                <Button
                                  variant="ghost"
                                  size="lg"
                                  className="w-full h-12 text-base font-medium text-foreground hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                                >
                                  Sign Out
                                </Button>
                              </SignOutButton>
                            </>
                          ) : (
                            <>
                              <Link href="/sign-in" className="block">
                                <Button
                                  variant="outline"
                                  size="lg"
                                  className="w-full h-12 text-base font-medium border-2 border-foreground/20 text-foreground hover:bg-foreground hover:text-background transition-all duration-200"
                                >
                                  LOG IN
                                </Button>
                              </Link>
                              <Link href="/signup" className="block">
                                <Button
                                  size="lg"
                                  className="w-full h-12 text-base font-medium bg-[#b12e2e] hover:bg-[#8e2424] text-white transition-all duration-200"
                                >
                                  SIGN UP
                                </Button>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* <NewsTicker /> */}

      <SearchModal open={searchModalOpen} onOpenChange={setSearchModalOpen} />
    </>
  )
}
