import { defineField, defineType, defineArrayMember } from 'sanity'

export const artistProfile = defineType({
  name: 'artistProfile',
  title: 'Artist Profile',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Artist Name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'subtitle', title: 'Tagline', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 }, validation: r => r.required() }),
    defineField({ name: 'genre', title: 'Genre', type: 'string' }),
    defineField({ name: 'website', title: 'Website', type: 'url' }),
    defineField({ name: 'featuredImage', title: 'Featured Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [defineArrayMember({ type: 'reference', to: [{ type: 'tag' }] })] }),
    defineField({ name: 'body', title: 'Profile Content', type: 'array', of: [defineArrayMember({ type: 'block' })] }),
    defineField({
      name: 'seo', title: 'SEO', type: 'object',
      fields: [
        defineField({ name: 'seoTitle', type: 'string', title: 'SEO Title' }),
        defineField({ name: 'metaDescription', type: 'text', title: 'Meta Description', rows: 2 }),
      ],
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'genre', media: 'featuredImage' } },
})
