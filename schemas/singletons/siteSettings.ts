import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({ name: 'siteTitle', title: 'Site Title', type: 'string' }),
    defineField({
      name: 'navItems', title: 'Navigation Items', type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'label', type: 'string', title: 'Label' }),
          defineField({ name: 'href', type: 'string', title: 'URL' }),
        ],
        preview: { select: { title: 'label', subtitle: 'href' } },
      }],
    }),
  ],
})
