import { createClient } from 'next-sanity'
import { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_VERSION } from './config'

export const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: true,
})
