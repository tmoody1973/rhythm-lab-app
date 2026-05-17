import { client } from '../client'
import { imageUrlBuilder } from '../image'

describe('Sanity client', () => {
  it('has correct project config', () => {
    const config = client.config()
    expect(config.projectId).toBe('b9cutvrc')
    expect(config.dataset).toBe('production')
    expect(config.useCdn).toBe(true)
  })

  it('image builder generates a URL for a Sanity image reference', () => {
    const ref = {
      asset: { _ref: 'image-abc123-100x100-jpg' }
    }
    const url = imageUrlBuilder.image(ref).width(300).url()
    expect(url).toContain('cdn.sanity.io')
    expect(url).toContain('w=300')
  })
})
