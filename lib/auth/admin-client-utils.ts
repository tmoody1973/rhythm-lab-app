/**
 * Client-side Admin Authentication Utilities for Clerk Integration
 *
 * These utilities provide admin role checking for client components.
 * For server-side utilities, use admin-utils.ts
 */

import type { UserResource } from '@clerk/types'

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
 * Check if user is admin (client-side version)
 * @param user - Clerk user object
 * @returns boolean - true if user is admin
 */
export function isAdminUser(user: UserResource | null | undefined): boolean {
  if (!user) return false

  const metadata = user.publicMetadata as AdminMetadata

  return (
    metadata?.role === 'admin' ||
    metadata?.role === 'super_admin' ||
    metadata?.isAdmin === true
  )
}

/**
 * Get user's admin metadata (client-side version)
 * @param user - Clerk user object
 * @returns AdminMetadata - user's admin metadata
 */
export function getAdminMetadata(user: UserResource | null | undefined): AdminMetadata {
  if (!user) return {}

  return user.publicMetadata as AdminMetadata
}

/**
 * Check if user has specific permission (client-side version)
 * @param user - Clerk user object
 * @param permission - Permission to check
 * @returns boolean - true if user has permission
 */
export function hasPermission(
  user: UserResource | null | undefined,
  permission: AdminPermission
): boolean {
  if (!user || !isAdminUser(user)) return false

  const metadata = user.publicMetadata as AdminMetadata
  const permissions = metadata?.permissions || []

  return permissions.includes(permission)
}

/**
 * Check if user has any of the specified permissions (client-side version)
 * @param user - Clerk user object
 * @param permissions - Array of permissions to check
 * @returns boolean - true if user has at least one permission
 */
export function hasAnyPermission(
  user: UserResource | null | undefined,
  permissions: AdminPermission[]
): boolean {
  if (!user || !isAdminUser(user)) return false

  return permissions.some(permission => hasPermission(user, permission))
}

/**
 * Get user's admin level (client-side version)
 * @param user - Clerk user object
 * @returns string - admin level or 'none'
 */
export function getAdminLevel(user: UserResource | null | undefined): string {
  if (!user || !isAdminUser(user)) return 'none'

  const metadata = user.publicMetadata as AdminMetadata
  return metadata?.adminLevel || 'basic'
}

/**
 * Check if user is super admin (client-side version)
 * @param user - Clerk user object
 * @returns boolean - true if user is super admin
 */
export function isSuperAdmin(user: UserResource | null | undefined): boolean {
  if (!user) return false

  const metadata = user.publicMetadata as AdminMetadata
  return (
    metadata?.role === 'super_admin' ||
    metadata?.adminLevel === 'super'
  )
}