import { defineQuery } from 'next-sanity'

export const ALL_EPISODES_QUERY = defineQuery(`
  *[_type == "showOverride" && defined(slug.current) && defined(title)] | order(date desc) {
    _id,
    title,
    "slug": slug.current,
    mixcloudKey,
    date,
    duration,
    "featuredImage": featuredImage{asset, hotspot, crop, alt},
    "tags": tags[]->{label, "slug": slug.current}
  }
`)

export const EPISODE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "showOverride" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    mixcloudKey,
    date,
    duration,
    "featuredImage": featuredImage{asset, hotspot, crop, alt},
    aiDescription,
    customDescription,
    "tracklist": tracklist[]{startTime, artistName, trackName},
    "tags": tags[]->{label, "slug": slug.current},
    "relatedContent": relatedContent[]->{_type, title, "slug": slug.current}
  }
`)

export const ALL_EPISODE_SLUGS_QUERY = defineQuery(`
  *[_type == "showOverride" && defined(slug.current)]{"slug": slug.current}
`)
