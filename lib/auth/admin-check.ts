import { currentUser } from '@clerk/nextjs/server'

export async function isAdmin(): Promise<boolean> {
  const user = await currentUser()

  if (!user) return false

  // Option A: Check metadata
  return user.publicMetadata?.role === 'admin' ||
         user.publicMetadata?.isAdmin === true
}

export async function requireAdmin() {
  const adminStatus = await isAdmin()

  if (!adminStatus) {
    throw new Error('Admin access required')
  }

  return true
}

export function hasPermission(user: any, permission: string): boolean {
  const permissions = user.publicMetadata?.permissions || []
  return permissions.includes(permission)
}