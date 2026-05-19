import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({ name: 'siteTitle', title: 'Site Title', type: 'string' }),
    defineField({
      name: 'navItems', title: 'Desktop Navigation', type: 'array',
      description: 'Full nav shown in the header on desktop and in the mobile sheet menu.',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'label', type: 'string', title: 'Label' }),
          defineField({ name: 'href', type: 'string', title: 'URL' }),
        ],
        preview: { select: { title: 'label', subtitle: 'href' } },
      }],
    }),
    defineField({
      name: 'mobileNavItems', title: 'Mobile Bottom Nav (max 5)', type: 'array',
      description: 'Curated 5 items for the bottom mobile bar. Falls back to first 5 of Desktop Navigation if empty.',
      validation: r => r.max(5),
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
