import { defineQuery } from 'next-sanity'

export const ALL_POSTS_QUERY = defineQuery(`
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    subtitle,
    "slug": slug.current,
    publishedAt,
    excerpt,
    "coverImage": coverImage{asset, hotspot, crop, alt},
    readingTime,
    "tags": tags[]->{label, "slug": slug.current},
    "author": author->{name, avatar}
  }
`)

export const POST_BY_SLUG_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    subtitle,
    "slug": slug.current,
    publishedAt,
    excerpt,
    "coverImage": coverImage{asset, hotspot, crop, alt},
    body,
    readingTime,
    "tags": tags[]->{label, "slug": slug.current},
    "author": author->{name, avatar},
    seo
  }
`)

export const ALL_POST_SLUGS_QUERY = defineQuery(`
  *[_type == "post"]{"slug": slug.current}
`)
