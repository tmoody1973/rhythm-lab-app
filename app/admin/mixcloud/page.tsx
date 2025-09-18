import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MixcloudAdminInterface } from '@/components/admin/mixcloud-admin-interface'

export default async function MixcloudAdminPage() {
  // Check authentication and admin role
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Check if user has admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/admin')
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