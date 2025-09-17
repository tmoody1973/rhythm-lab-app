"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SearchModal } from "@/components/search-modal"
import { NewsTicker } from "@/components/news-ticker"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { useAuth } from "@/lib/auth/context"

export function Header() {
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, loading } = useAuth()

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
                  src="/images/rlr_logo.png"
                  alt="Rhythm Lab Radio"
                  width={120}
                  height={40}
                  className="h-8 w-auto sm:h-10"
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
                {!mounted || loading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : user ? (
                  <Link href="/profile">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-foreground/20 text-foreground hover:bg-foreground hover:text-background text-sm px-4 py-2"
                    >
                      Profile
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
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
                    <Button variant="ghost" size="icon" className="hover:bg-transparent">
                      <span className="text-lg">☰</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-white border-border">
                    <nav className="flex flex-col gap-6 mt-8">
                      <Link href="/" >
                        <Button
                          variant="ghost"
                          className="nts-text-caps text-sm font-bold hover:bg-transparent justify-start px-0 text-black"
                          style={{ color: "#000000" }}
                        >
                          HOME
                        </Button>
                      </Link>
                      <Link href="/live" >
                        <Button
                          variant="ghost"
                          className="nts-text-caps text-sm font-bold hover:bg-transparent justify-start px-0 text-black"
                          style={{ color: "#000000" }}
                        >
                          LIVE
                        </Button>
                      </Link>
                      <Link href="/blog" >
                        <Button
                          variant="ghost"
                          className="nts-text-caps text-sm font-bold hover:bg-transparent justify-start px-0 text-black"
                          style={{ color: "#000000" }}
                        >
                          BLOG
                        </Button>
                      </Link>
                      <Link href="/deep-dives" >
                        <Button
                          variant="ghost"
                          className="nts-text-caps text-sm font-bold hover:bg-transparent justify-start px-0 text-black"
                          style={{ color: "#000000" }}
                        >
                          DEEP DIVES
                        </Button>
                      </Link>
                      <Link href="/profiles" >
                        <Button
                          variant="ghost"
                          className="nts-text-caps text-sm font-bold hover:bg-transparent justify-start px-0 text-black"
                          style={{ color: "#000000" }}
                        >
                          PROFILES
                        </Button>
                      </Link>
                      <Link href="/archive" >
                        <Button
                          variant="ghost"
                          className="nts-text-caps text-sm font-bold hover:bg-transparent justify-start px-0 text-black"
                          style={{ color: "#000000" }}
                        >
                          WEEKLY SHOW
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="nts-text-caps text-sm font-bold hover:bg-transparent justify-start px-0 text-black"
                        style={{ color: "#000000" }}
                        onClick={() => setSearchModalOpen(true)}
                      >
                        SEARCH
                      </Button>

                      {/* Auth buttons for mobile */}
                      <div className="border-t border-border/30 pt-6 mt-6">
                        <div className="flex flex-col gap-3">
                          {!mounted || loading ? (
                            <div className="text-sm text-muted-foreground text-center">Loading...</div>
                          ) : user ? (
                            <Link href="/profile" >
                              <Button
                                variant="outline"
                                className="border-foreground/20 text-foreground hover:bg-foreground hover:text-background w-full"
                              >
                                Profile
                              </Button>
                            </Link>
                          ) : (
                            <>
                              <Link href="/login" >
                                <Button
                                  variant="outline"
                                  className="border-foreground/20 text-foreground hover:bg-foreground hover:text-background w-full"
                                >
                                  Log In
                                </Button>
                              </Link>
                              <Link href="/signup" >
                                <Button
                                  className="bg-foreground text-background hover:bg-foreground/90 w-full"
                                >
                                  Sign Up
                                </Button>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </nav>
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
