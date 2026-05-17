import { defineQuery } from 'next-sanity'

export const SHOW_OVERRIDE_BY_KEY_QUERY = defineQuery(`
  *[_type == "showOverride" && mixcloudKey == $mixcloudKey][0] {
    _id, title, mixcloudKey, "slug": slug.current,
    "featuredImage": featuredImage{asset, hotspot, crop, alt},
    aiDescription, customDescription,
    "tracklist": tracklist[]{startTime, artistName, trackName},
    "tags": tags[]->{label, "slug": slug.current},
    "relatedContent": relatedContent[]->{_type, title, "slug": slug.current}
  }
`)
