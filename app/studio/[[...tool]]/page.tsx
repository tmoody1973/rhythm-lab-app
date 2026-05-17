import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function StudioPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  return <NextStudio config={config} />
}
