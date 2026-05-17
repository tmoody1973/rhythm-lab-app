import { author } from './author'
import { tag } from './tag'
import { post } from './post'
import { deepDive } from './deepDive'
import { aboutPage } from './singletons/aboutPage'
import { siteSettings } from './singletons/siteSettings'

export const schemaTypes = [author, tag, post, deepDive, aboutPage, siteSettings]
