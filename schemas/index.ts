import { author } from './author'
import { tag } from './tag'
import { post } from './post'
import { deepDive } from './deepDive'
import { artistProfile } from './artistProfile'
import { showOverride } from './showOverride'
import { aboutPage } from './singletons/aboutPage'
import { siteSettings } from './singletons/siteSettings'

export const schemaTypes = [author, tag, post, deepDive, artistProfile, showOverride, aboutPage, siteSettings]
