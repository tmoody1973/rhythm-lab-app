'use client'

import { useEffect, useState } from 'react'

export default function NewsletterForm() {
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setIsError(false)

    try {
      const formData = new FormData()
      formData.append('newsletter-form-input', email)

      const response = await fetch('https://app.loops.so/api/newsletter-form/cmfrb7i1x0ueuxk0iivi5m1b1', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        setIsSuccess(true)
      } else {
        throw new Error('Network response was not ok')
      }
    } catch (error) {
      setIsError(true)
      setTimeout(() => setIsError(false), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return <div className="bg-card border-2 border-border/50 rounded-xl p-4 animate-pulse h-20"></div>
  }

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center w-full p-4">
        <p className="text-foreground text-sm font-medium">Thanks for subscribing to the Rhythm Lab Selector</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center w-full gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        className="font-sans text-foreground text-sm w-full max-w-[300px] min-w-[100px] bg-background border border-border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />

      {isLoading ? (
        <button
          type="button"
          disabled
          className="bg-[#b12e2e] text-white text-sm font-medium w-full max-w-[300px] h-[38px] flex items-center justify-center rounded-md shadow-sm cursor-not-allowed"
        >
          Please wait...
        </button>
      ) : (
        <button
          type="submit"
          className="bg-[#b12e2e] hover:bg-[#8e2424] text-white text-sm font-medium w-full max-w-[300px] h-[38px] flex items-center justify-center rounded-md shadow-sm transition-colors duration-200"
        >
          Subscribe
        </button>
      )}

      {isError && (
        <p className="text-red-600 text-sm text-center">
          Oops! There was an error sending your submission. Please try again!
        </p>
      )}
    </form>
  )
}