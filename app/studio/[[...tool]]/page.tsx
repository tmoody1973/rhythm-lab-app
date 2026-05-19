'use client'

import { useEffect } from 'react'

// The Sanity Studio is hosted at https://rhythmlab.sanity.studio
// Embedding the Studio in the Next.js bundle causes webpack incompatibilities
// with sanity v5's use of useEffectEvent (a React 19.2+ API not in Next.js 15's webpack).
export default function StudioRedirectPage() {
  useEffect(() => {
    window.location.replace('https://rhythmlab.sanity.studio')
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Redirecting to Sanity Studio…</p>
        <p style={{ marginTop: '8px' }}>
          <a href="https://rhythmlab.sanity.studio" style={{ color: '#e85c2a' }}>
            Click here if not redirected
          </a>
        </p>
      </div>
    </div>
  )
}
