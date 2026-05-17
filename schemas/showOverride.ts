import { defineField, defineType, defineArrayMember } from 'sanity'

export const showOverride = defineType({
  name: 'showOverride',
  title: 'Episode',
  type: 'document',
  fields: [
    defineField({
      name: 'mixcloudKey', title: 'Mixcloud Key', type: 'string',
      description: 'The Mixcloud show key, e.g. /rhythmlab/show-name/',
      validation: r => r.required(),
    }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({ name: 'date', title: 'Date', type: 'datetime' }),
    defineField({ name: 'duration', title: 'Duration (seconds)', type: 'number' }),
    defineField({ name: 'featuredImage', title: 'Cover Image', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'aiDescription', title: 'AI Description', type: 'array',
      description: 'Auto-generated from tracklist. Editors can override with Editorial Description.',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'customDescription', title: 'Editorial Description', type: 'array',
      description: 'If set, overrides the AI Description on the episode page.',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'tracklist', title: 'Tracklist', type: 'array',
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({ name: 'startTime', title: 'Start Time (seconds)', type: 'number' }),
          defineField({ name: 'artistName', title: 'Artist', type: 'string' }),
          defineField({ name: 'trackName', title: 'Track', type: 'string' }),
        ],
        preview: {
          select: { title: 'trackName', subtitle: 'artistName' },
        },
      })],
    }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [defineArrayMember({ type: 'reference', to: [{ type: 'tag' }] })] }),
    defineField({
      name: 'relatedContent', title: 'Related Content', type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'post' }, { type: 'deepDive' }, { type: 'artistProfile' }] })],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'date', media: 'featuredImage' },
    prepare({ title, subtitle, media }: { title?: string; subtitle?: string; media: unknown }) {
      return {
        title: title || 'Untitled Episode',
        subtitle: subtitle ? new Date(subtitle).toLocaleDateString() : 'No date',
        media,
      }
    },
  },
})
