import { defineLive } from 'next-sanity/live'
import { client } from './client'
import { SANITY_API_VERSION } from './config'

export const { sanityFetch, SanityLive } = defineLive({
  client: client.withConfig({ apiVersion: SANITY_API_VERSION }),
  serverToken: process.env.SANITY_API_READ_TOKEN,
  // browserToken omitted — browser subscriptions disabled for public site
})
