import { defineQuery } from 'next-sanity'

export const ALL_DEEP_DIVES_QUERY = defineQuery(`
  *[_type == "deepDive"] | order(publishedAt desc) {
    _id,
    title,
    subtitle,
    "slug": slug.current,
    publishedAt,
    excerpt,
    estimatedReadTime,
    difficultyLevel,
    "coverImage": coverImage{asset, hotspot, crop, alt},
    "tags": tags[]->{label, "slug": slug.current},
    "author": author->{name, avatar}
  }
`)

export const DEEP_DIVE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "deepDive" && slug.current == $slug][0] {
    _id,
    title,
    subtitle,
    "slug": slug.current,
    publishedAt,
    excerpt,
    estimatedReadTime,
    difficultyLevel,
    relatedArtists,
    "coverImage": coverImage{asset, hotspot, crop, alt},
    body,
    "tags": tags[]->{label, "slug": slug.current},
    "author": author->{name, avatar},
    seo
  }
`)

export const ALL_DEEP_DIVE_SLUGS_QUERY = defineQuery(`
  *[_type == "deepDive"]{"slug": slug.current}
`)
