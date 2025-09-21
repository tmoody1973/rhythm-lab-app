/**
 * Admin Authentication Utilities for Clerk Integration
 *
 * These utilities provide admin role checking and permission management
 * for the migrated Clerk authentication system.
 */

import { currentUser, auth } from '@clerk/nextjs/server'
import type { User } from '@clerk/nextjs/server'

// Admin role types
export type AdminRole = 'admin' | 'super_admin'
export type AdminPermission =
  | 'admin_dashboard'
  | 'mixcloud_import'
  | 'content_management'
  | 'user_management'
  | 'system_settings'

// Admin metadata interface
export interface AdminMetadata {
  role?: AdminRole
  isAdmin?: boolean
  permissions?: AdminPermission[]
  adminLevel?: 'basic' | 'advanced' | 'super'
}

/**
 * Check if the current user is an admin
 * @returns Promise<boolean> - true if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await currentUser()

    if (!user) return false

    const metadata = user.publicMetadata as AdminMetadata

    return (
      metadata?.role === 'admin' ||
      metadata?.role === 'super_admin' ||
      metadata?.isAdmin === true
    )
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Check if user is admin (synchronous version for client components)
 * @param user - Clerk user object
 * @returns boolean - true if user is admin
 */
export function isAdminSync(user: User | null): boolean {
  if (!user) return false

  const metadata = user.publicMetadata as AdminMetadata

  return (
    metadata?.role === 'admin' ||
    metadata?.role === 'super_admin' ||
    metadata?.isAdmin === true
  )
}

/**
 * Require admin access or throw error
 * @throws Error if user is not admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await currentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  if (!isAdminSync(user)) {
    throw new Error('Admin access required')
  }

  return user
}

/**
 * Check if user has specific permission
 * @param user - Clerk user object
 * @param permission - Permission to check
 * @returns boolean - true if user has permission
 */
export function hasPermission(
  user: User | null,
  permission: AdminPermission
): boolean {
  if (!user || !isAdminSync(user)) return false

  const metadata = user.publicMetadata as AdminMetadata
  const permissions = metadata?.permissions || []

  return permissions.includes(permission)
}

/**
 * Check if user has any of the specified permissions
 * @param user - Clerk user object
 * @param permissions - Array of permissions to check
 * @returns boolean - true if user has at least one permission
 */
export function hasAnyPermission(
  user: User | null,
  permissions: AdminPermission[]
): boolean {
  if (!user || !isAdminSync(user)) return false

  return permissions.some(permission => hasPermission(user, permission))
}

/**
 * Get user's admin metadata
 * @param user - Clerk user object
 * @returns AdminMetadata - user's admin metadata
 */
export function getAdminMetadata(user: User | null): AdminMetadata {
  if (!user) return {}

  return user.publicMetadata as AdminMetadata
}

/**
 * Get user's admin level
 * @param user - Clerk user object
 * @returns string - admin level or 'none'
 */
export function getAdminLevel(user: User | null): string {
  if (!user || !isAdminSync(user)) return 'none'

  const metadata = user.publicMetadata as AdminMetadata
  return metadata?.adminLevel || 'basic'
}

/**
 * Check if user is super admin
 * @param user - Clerk user object
 * @returns boolean - true if user is super admin
 */
export function isSuperAdmin(user: User | null): boolean {
  if (!user) return false

  const metadata = user.publicMetadata as AdminMetadata
  return (
    metadata?.role === 'super_admin' ||
    metadata?.adminLevel === 'super'
  )
}

/**
 * Server-side admin guard for API routes
 * @returns Promise<User> - authenticated admin user
 * @throws Error if not admin
 */
export async function adminGuard(): Promise<User> {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized - No user session')
  }

  const user = await currentUser()

  if (!user) {
    throw new Error('Unauthorized - User not found')
  }

  if (!isAdminSync(user)) {
    throw new Error('Forbidden - Admin access required')
  }

  return user
}

/**
 * Permission guard for specific admin actions
 * @param permission - Required permission
 * @returns Promise<User> - authenticated user with permission
 * @throws Error if permission not granted
 */
export async function permissionGuard(permission: AdminPermission): Promise<User> {
  const user = await adminGuard()

  if (!hasPermission(user, permission)) {
    throw new Error(`Forbidden - Missing permission: ${permission}`)
  }

  return user
}

/**
 * Default admin permissions for new admin accounts
 */
export const DEFAULT_ADMIN_PERMISSIONS: AdminPermission[] = [
  'admin_dashboard',
  'mixcloud_import',
  'content_management'
]

/**
 * Super admin permissions (all permissions)
 */
export const SUPER_ADMIN_PERMISSIONS: AdminPermission[] = [
  'admin_dashboard',
  'mixcloud_import',
  'content_management',
  'user_management',
  'system_settings'
]

/**
 * Migration helper: Convert Supabase admin to Clerk metadata format
 * @param supabaseProfile - Original Supabase profile
 * @returns AdminMetadata - Clerk metadata format
 */
export function convertSupabaseAdminToClerkMetadata(supabaseProfile: {
  role: string
  email: string
}): AdminMetadata {
  const isSuperAdmin = supabaseProfile.role === 'super_admin'

  return {
    role: supabaseProfile.role as AdminRole,
    isAdmin: true,
    permissions: isSuperAdmin ? SUPER_ADMIN_PERMISSIONS : DEFAULT_ADMIN_PERMISSIONS,
    adminLevel: isSuperAdmin ? 'super' : 'advanced'
  }
}