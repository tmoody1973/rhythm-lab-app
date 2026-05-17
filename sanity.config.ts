import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'rhythm-lab',
  title: 'Rhythm Lab',
  projectId: 'b9cutvrc',
  dataset: 'production',
  basePath: '/studio',
  plugins: [
    structureTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})
