import { defineField, defineType } from 'sanity'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'heroText', title: 'Hero Text', type: 'text', rows: 3 }),
    defineField({
      name: 'body', title: 'Body', type: 'array',
      of: [{ type: 'block' }],
    }),
  ],
})
