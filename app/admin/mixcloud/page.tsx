import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MixcloudAdminInterface } from '@/components/admin/mixcloud-admin-interface'

export default async function MixcloudAdminPage() {
  // Check authentication and admin role using Clerk
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Check if user has admin role in Clerk metadata
  const metadata = user.publicMetadata as { role?: string; isAdmin?: boolean }
  const isAdmin = metadata?.role === 'admin' || metadata?.isAdmin === true

  if (!isAdmin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Mixcloud Import Manager
          </h1>
          <p className="text-muted-foreground">
            Import and manage Mixcloud shows, playlists, and track data
          </p>
        </div>

        {/* Admin Interface Component */}
        <MixcloudAdminInterface />
      </div>
    </div>
  )
}