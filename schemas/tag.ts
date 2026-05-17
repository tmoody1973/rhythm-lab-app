import { defineField, defineType } from 'sanity'

export const tag = defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', validation: r => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'label', maxLength: 96 },
      validation: r => r.required(),
    }),
  ],
  preview: { select: { title: 'label' } },
})
