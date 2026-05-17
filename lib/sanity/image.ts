import createImageUrlBuilder from '@sanity/image-url'
import { client } from './client'

export const imageUrlBuilder = createImageUrlBuilder(client)

export function urlForImage(source: Parameters<typeof imageUrlBuilder.image>[0]) {
  return imageUrlBuilder.image(source)
}
