import { defineQuery } from 'next-sanity'

export const SHOW_OVERRIDE_BY_KEY_QUERY = defineQuery(`
  *[_type == "showOverride" && mixcloudKey == $mixcloudKey][0] {
    _id, mixcloudKey,
    "featuredImage": featuredImage{asset, hotspot, crop, alt},
    customDescription,
    "tags": tags[]->{label, "slug": slug.current},
    "relatedContent": relatedContent[]->{
      _type, title, "slug": slug.current
    }
  }
`)
