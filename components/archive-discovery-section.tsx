'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/favorite-button"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Show {
  id: string
  title: string
  description: string
  published_date: string
  slug: string
  mixcloud_url: string
  mixcloud_picture: string
  track_count: number
  duration_formatted: string | null
  tags: string[]
}

interface WeeklyShowProps {
  latestShow?: Show | null
  showIndex?: number
}

function WeeklyShowCard({ latestShow, showIndex = 0 }: WeeklyShowProps) {
  if (!latestShow) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm hover:shadow-lg hover:bg-card/90 transition-all duration-200 cursor-pointer overflow-hidden border border-border/30 rounded-xl">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">Loading latest show...</div>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  // Color schemes for different shows
  const colorSchemes = [
    { bg: 'bg-[#8b5cf6]', border: 'border-[#8b5cf6]', text: 'text-[#8b5cf6]', hover: 'hover:bg-[#7c3aed]' },
    { bg: 'bg-[#b12e2e]', border: 'border-[#b12e2e]', text: 'text-[#b12e2e]', hover: 'hover:bg-[#8e2424]' },
    { bg: 'bg-[#f59e0b]', border: 'border-[#f59e0b]', text: 'text-[#f59e0b]', hover: 'hover:bg-[#d97706]' },
    { bg: 'bg-[#10b981]', border: 'border-[#10b981]', text: 'text-[#10b981]', hover: 'hover:bg-[#059669]' },
    { bg: 'bg-[#ef4444]', border: 'border-[#ef4444]', text: 'text-[#ef4444]', hover: 'hover:bg-[#dc2626]' }
  ]

  const colors = colorSchemes[showIndex % colorSchemes.length]

  return (
    <Link href={`/show/${latestShow.slug}`}>
      <Card className="bg-card/80 backdrop-blur-sm hover:shadow-lg hover:bg-card/90 transition-all duration-200 cursor-pointer overflow-hidden border border-border/30 rounded-xl">
        <div className="aspect-[16/9] relative overflow-hidden">
          <img
            src={latestShow.mixcloud_picture || "/images/ALBUM-DEFAULT.png"}
            alt={`${latestShow.title} artwork`}
            className="w-full h-full object-cover"
          />
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Badge className={`${colors.bg} text-white text-xs px-3 py-1 rounded-full font-medium`}>WEEKLY</Badge>
            <span className="text-sm text-muted-foreground font-medium">{formatDate(latestShow.published_date)}</span>
          </div>
          <h3 className="text-foreground font-bold text-lg mb-3 leading-tight text-balance">
            {latestShow.title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {latestShow.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`${colors.border} ${colors.text} text-xs px-3 py-1 rounded-full font-medium`}
              >
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>{latestShow.duration_formatted || "2h 15m"} • {latestShow.track_count} tracks</span>
              <FavoriteButton
                content={{
                  id: latestShow.id,
                  title: latestShow.title,
                  type: 'show',
                  image: latestShow.mixcloud_picture || "/images/ALBUM-DEFAULT.png",
                  description: latestShow.description
                }}
                size="sm"
              />
            </div>
            <Button size="sm" className={`${colors.bg} ${colors.hover} text-white text-sm px-4 py-2`}>
              ▶ Play
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ArchiveDiscoverySection() {
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatestShows = async () => {
      try {
        const params = new URLSearchParams({
          limit: '4',
          offset: '0',
          status: 'published'
        })

        const response = await fetch(`/api/storyblok/shows?${params}`)
        const data = await response.json()

        if (data.success && data.shows.length > 0) {
          setShows(data.shows)
        }
      } catch (error) {
        console.error('Error fetching latest shows:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestShows()
  }, [])

  return (
    <div className="space-y-6">
      {/* Archive Shows Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground uppercase tracking-wide flex items-center gap-2 mb-4">WEEKLY SHOW</h2>
          <div className="grid grid-cols-1 gap-4">
            {/* Recent Mixcloud Shows - Dynamic */}
            {loading ? (
              <Card className="bg-card/80 backdrop-blur-sm hover:shadow-lg hover:bg-card/90 transition-all duration-200 cursor-pointer overflow-hidden border border-border/30 rounded-xl">
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground">Loading latest shows...</div>
                </CardContent>
              </Card>
            ) : (
              shows.map((show, index) => (
                <WeeklyShowCard key={show.id} latestShow={show} showIndex={index} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">📧 Newsletter</h3>
        <div className="bg-card border-2 border-border/50 rounded-xl p-4">
          <div
            dangerouslySetInnerHTML={{
              __html: `
                <style>@import url('https://fonts.googleapis.com/css2?family=Inter&display=swap');</style>
                <div class="newsletter-form-container">
                  <form class="newsletter-form" action="https://app.loops.so/api/newsletter-form/cmfrb7i1x0ueuxk0iivi5m1b1" method="POST" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
                    <input class="newsletter-form-input" name="newsletter-form-input" type="email" placeholder="you@example.com" required="" style="font-family: Inter, sans-serif; color: rgb(0, 0, 0); font-size: 14px; margin: 0px 0px 10px; width: 100%; max-width: 300px; min-width: 100px; background: rgb(255, 255, 255); border: 1px solid rgb(209, 213, 219); box-sizing: border-box; box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px; border-radius: 6px; padding: 8px 12px;">
                    <button type="submit" class="newsletter-form-button" style="background: rgb(148, 13, 70); font-size: 14px; color: rgb(255, 255, 255); font-family: Inter, sans-serif; display: flex; width: 100%; max-width: 300px; white-space: normal; height: 38px; align-items: center; justify-content: center; flex-direction: row; padding: 9px 17px; box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px; border-radius: 6px; text-align: center; font-style: normal; font-weight: 500; line-height: 20px; border: none; cursor: pointer;">Subscribe</button>
                    <button type="button" class="newsletter-loading-button" style="background: rgb(148, 13, 70); font-size: 14px; color: rgb(255, 255, 255); font-family: Inter, sans-serif; display: none; width: 100%; max-width: 300px; white-space: normal; height: 38px; align-items: center; justify-content: center; flex-direction: row; padding: 9px 17px; box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px; border-radius: 6px; text-align: center; font-style: normal; font-weight: 500; line-height: 20px; border: none; cursor: pointer;">Please wait...</button>
                  </form>
                  <div class="newsletter-success" style="display: none; align-items: center; justify-content: center; width: 100%;">
                    <p class="newsletter-success-message" style="font-family: Inter, sans-serif; color: rgb(0, 0, 0); font-size: 15px;">Thanks for subscribing to the Rhythm Lab Selector</p>
                  </div>
                  <div class="newsletter-error" style="display: none; align-items: center; justify-content: center; width: 100%;">
                    <p class="newsletter-error-message" style="font-family: Inter, sans-serif; color: rgb(185, 28, 28); font-size: 15px;">Oops! Something went wrong, please try again</p>
                  </div>
                  <button
                    class='newsletter-back-button'
                    type='button'
                    style='color:#6b7280;font: 14px, Inter, sans-serif;margin:10px auto;text-align:center;display:none;background:transparent;border:none;cursor:pointer'
                    onmouseout='this.style.textDecoration="none"'
                    onmouseover='this.style.textDecoration="underline"'>
                    ← Back
                  </button>
                </div>
                <script>
                function submitHandler(event) {
                  event.preventDefault();
                  var container = event.target.parentNode;
                  var form = container.querySelector(".newsletter-form");
                  var formInput = container.querySelector(".newsletter-form-input");
                  var success = container.querySelector(".newsletter-success");
                  var errorContainer = container.querySelector(".newsletter-error");
                  var errorMessage = container.querySelector(".newsletter-error-message");
                  var backButton = container.querySelector(".newsletter-back-button");
                  var submitButton = container.querySelector(".newsletter-form-button");
                  var loadingButton = container.querySelector(".newsletter-loading-button");

                  const rateLimit = () => {
                    errorContainer.style.display = "flex";
                    errorMessage.innerText = "Too many signups, please try again in a little while";
                    submitButton.style.display = "none";
                    formInput.style.display = "none";
                    backButton.style.display = "block";
                  }

                  var time = new Date();
                  var timestamp = time.valueOf();
                  var previousTimestamp = localStorage.getItem("loops-form-timestamp");

                  if (previousTimestamp && Number(previousTimestamp) + 60000 > timestamp) {
                    rateLimit();
                    return;
                  }
                  localStorage.setItem("loops-form-timestamp", timestamp);

                  submitButton.style.display = "none";
                  loadingButton.style.display = "flex";

                  var formBody = "userGroup=&mailingLists=&email=" + encodeURIComponent(formInput.value);

                  fetch(event.target.action, {
                    method: "POST",
                    body: formBody,
                    headers: {
                      "Content-Type": "application/x-www-form-urlencoded",
                    },
                  })
                    .then((res) => [res.ok, res.json(), res])
                    .then(([ok, dataPromise, res]) => {
                      if (ok) {
                        success.style.display = "flex";
                        form.reset();
                      } else {
                        dataPromise.then(data => {
                          errorContainer.style.display = "flex";
                          errorMessage.innerText = data.message ? data.message : res.statusText;
                        });
                      }
                    })
                    .catch(error => {
                      if (error.message === "Failed to fetch") {
                        rateLimit();
                        return;
                      }
                      errorContainer.style.display = "flex";
                      if (error.message) errorMessage.innerText = error.message;
                      localStorage.setItem("loops-form-timestamp", '');
                    })
                    .finally(() => {
                      formInput.style.display = "none";
                      loadingButton.style.display = "none";
                      backButton.style.display = "block";
                    });
                }

                function resetFormHandler(event) {
                  var container = event.target.parentNode;
                  var formInput = container.querySelector(".newsletter-form-input");
                  var success = container.querySelector(".newsletter-success");
                  var errorContainer = container.querySelector(".newsletter-error");
                  var errorMessage = container.querySelector(".newsletter-error-message");
                  var backButton = container.querySelector(".newsletter-back-button");
                  var submitButton = container.querySelector(".newsletter-form-button");

                  success.style.display = "none";
                  errorContainer.style.display = "none";
                  errorMessage.innerText = "Oops! Something went wrong, please try again";
                  backButton.style.display = "none";
                  formInput.style.display = "flex";
                  submitButton.style.display = "flex";
                }

                var formContainers = document.getElementsByClassName("newsletter-form-container");
                for (var i = 0; i < formContainers.length; i++) {
                  var formContainer = formContainers[i];
                  var handlersAdded = formContainer.classList.contains('newsletter-handlers-added');
                  if (handlersAdded) continue;
                  formContainer.querySelector(".newsletter-form").addEventListener("submit", submitHandler);
                  formContainer.querySelector(".newsletter-back-button").addEventListener("click", resetFormHandler);
                  formContainer.classList.add("newsletter-handlers-added");
                }
                </script>
              `
            }}
          />
        </div>
      </div>

    </div>
  )
}
