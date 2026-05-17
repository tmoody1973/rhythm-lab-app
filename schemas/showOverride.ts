import { defineField, defineType, defineArrayMember } from 'sanity'

export const showOverride = defineType({
  name: 'showOverride',
  title: 'Show Editorial Override',
  type: 'document',
  fields: [
    defineField({
      name: 'mixcloudKey', title: 'Mixcloud Key', type: 'string',
      description: 'The Mixcloud show key, e.g. /rhythmlab/show-name/',
      validation: r => r.required(),
    }),
    defineField({ name: 'featuredImage', title: 'Featured Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'customDescription', title: 'Editorial Description', type: 'array', of: [defineArrayMember({ type: 'block' })] }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [defineArrayMember({ type: 'reference', to: [{ type: 'tag' }] })] }),
    defineField({
      name: 'relatedContent', title: 'Related Content', type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'post' }, { type: 'deepDive' }, { type: 'artistProfile' }] })],
    }),
  ],
  preview: {
    select: { title: 'mixcloudKey', media: 'featuredImage' },
    prepare({ title, media }: { title: string; media: unknown }) {
      return { title: `Show: ${title}`, media }
    },
  },
})
