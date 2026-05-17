import { defineQuery } from 'next-sanity'

export const ABOUT_PAGE_QUERY = defineQuery(`
  *[_type == "aboutPage"][0] {
    title,
    heroText,
    body
  }
`)

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0] {
    siteTitle,
    navItems
  }
`)
