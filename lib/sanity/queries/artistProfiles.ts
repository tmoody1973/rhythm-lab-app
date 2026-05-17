import { defineQuery } from 'next-sanity'

export const ALL_ARTIST_PROFILES_QUERY = defineQuery(`
  *[_type == "artistProfile"] | order(title asc) {
    _id, title, subtitle, "slug": slug.current,
    genre, "featuredImage": featuredImage{asset, hotspot, crop, alt},
    "tags": tags[]->{label, "slug": slug.current}
  }
`)

export const ARTIST_PROFILE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "artistProfile" && slug.current == $slug][0] {
    _id, title, subtitle, "slug": slug.current,
    genre, website, "featuredImage": featuredImage{asset, hotspot, crop, alt},
    body, "tags": tags[]->{label, "slug": slug.current}, seo
  }
`)

export const ALL_ARTIST_PROFILE_SLUGS_QUERY = defineQuery(`
  *[_type == "artistProfile"]{"slug": slug.current}
`)
