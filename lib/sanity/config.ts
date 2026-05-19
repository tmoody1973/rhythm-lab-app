// Use || not ?? so empty string env vars fall back to hardcoded defaults
export const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'b9cutvrc'
export const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const SANITY_API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-05-17'
