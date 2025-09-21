# Phase 2: Configure Clerk for Admin Roles

**Objective:** Set up Clerk to support admin authentication with proper role-based access control

---

## 🎯 Two Configuration Options

### Option A: Simple User Metadata Approach (Recommended)
**Pros:** Free, simple, immediate implementation
**Cons:** Less granular permissions, requires custom code

### Option B: Organizations with Roles (Advanced)
**Pros:** Built-in RBAC, granular permissions
**Cons:** Requires paid plan with B2B SaaS add-on

---

## 🚀 OPTION A: User Metadata Approach (Recommended for Your Use Case)

This approach uses Clerk's `publicMetadata` to store admin roles, which is perfect for your current needs.

### Step 1: Configure Clerk Dashboard Settings

1. **Log into Clerk Dashboard**
   - Go to https://dashboard.clerk.com
   - Select your project: `rhythm-lab-app`

2. **Update User Settings**
   - Navigate to **"Users & Authentication"** → **"User & Profile"**
   - Ensure **"Username"** is enabled (optional but recommended)
   - Ensure **"Profile"** section allows custom fields

3. **Configure Metadata Fields**
   - Go to **"Users & Authentication"** → **"Metadata"**
   - Add these custom fields to **"Public Metadata"**:
     ```json
     {
       "role": "admin",
       "permissions": ["admin_dashboard", "mixcloud_import", "content_management"]
     }
     ```

### Step 2: Create Admin User Accounts

**Important:** You'll manually create these accounts and then assign admin metadata.

1. **Go to Users Section**
   - Navigate to **"Users & Authentication"** → **"Users"**
   - Click **"Create User"**

2. **Create Primary Admin Account**
   ```
   Email: admin@rhythmlabradio.com
   Username: admin (optional)
   Password: [Generate secure password]
   Email Verified: ✓ Yes
   ```

3. **Create Personal Admin Account**
   ```
   Email: tarikjmoody@gmail.com
   Username: tarik (optional)
   Password: [Generate secure password]
   Email Verified: ✓ Yes
   ```

4. **Set Admin Metadata for Each User**
   - Click on each user
   - Go to **"Metadata"** tab
   - In **"Public Metadata"** section, add:
   ```json
   {
     "role": "admin",
     "isAdmin": true,
     "permissions": [
       "admin_dashboard",
       "mixcloud_import",
       "content_management",
       "user_management"
     ],
     "adminLevel": "super"
   }
   ```

### Step 3: Configure Session Claims

1. **Go to Sessions Settings**
   - Navigate to **"Users & Authentication"** → **"Sessions"**
   - Click **"Customize session token"**

2. **Add Admin Claims**
   - Add this to make admin status available in session:
   ```json
   {
     "role": "{{user.public_metadata.role}}",
     "isAdmin": "{{user.public_metadata.isAdmin}}",
     "permissions": "{{user.public_metadata.permissions}}"
   }
   ```

---

## 🏢 OPTION B: Organizations Approach (Future Upgrade)

If you later want more sophisticated role management:

### Step 1: Enable Organizations

1. **Enable Organizations Feature**
   - Go to **"Organizations"** in Clerk Dashboard
   - Click **"Enable Organizations"**
   - Choose settings:
     - ✅ Allow users to create organizations
     - ✅ Allow users to be members of multiple organizations
     - ❌ Restrict to verified domains (unless needed)

### Step 2: Create Admin Organization

1. **Create "Rhythm Lab Admin" Organization**
   - Name: `Rhythm Lab Admin`
   - Slug: `rhythm-lab-admin`
   - Members limit: 10

2. **Configure Roles**
   - Default roles available: `org:admin`, `org:member`
   - Admin role has full permissions by default

### Step 3: Add Admin Users to Organization

1. **Invite Admin Users**
   - Add `admin@rhythmlabradio.com` with `org:admin` role
   - Add `tarikjmoody@gmail.com` with `org:admin` role

---

## 🔧 Implementation Code Changes Needed

### 1. Update Environment Variables (.env.local)

Add these Clerk configuration variables:
```bash
# Clerk Admin Configuration
NEXT_PUBLIC_CLERK_ENABLE_ORGANIZATIONS=false  # true if using Option B
CLERK_ADMIN_ROLE=admin
CLERK_ADMIN_ORGANIZATION_SLUG=rhythm-lab-admin  # only for Option B
```

### 2. Create Admin Check Utility

Create `lib/auth/admin-check.ts`:
```typescript
import { currentUser } from '@clerk/nextjs'

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
```

### 3. Update Middleware for Admin Routes

✅ **COMPLETED** - Update `middleware.ts`:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/favorites(.*)',
])

// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

// Main Clerk middleware with unified authentication
export default clerkMiddleware(async (auth, req) => {
  // Admin routes: Temporarily allow all while setting up admin accounts
  if (isAdminRoute(req)) {
    // For now, just require authentication until admin accounts are created
    auth().protect()
    // TODO: Add proper admin role checking after Phase 3 completion
    // auth().protect((has) => has({ role: 'admin' }))
  }

  // Regular protected routes: Just require authentication
  if (isProtectedRoute(req)) {
    auth().protect()
  }

  // All other routes are public
})

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}
```

**Status:** ✅ **Working** - `/admin` now properly redirects to Clerk sign-in and allows authenticated users access.

---

## 📋 Verification Checklist

After configuration:

- [ ] Can create new users in Clerk dashboard
- [ ] Admin metadata is properly set on user accounts
- [ ] Session tokens include admin claims
- [ ] Test accounts can sign in (test with temp passwords)
- [ ] Admin check utility functions work
- [ ] Middleware protects admin routes

---

## 🔄 Migration Notes

### Password Reset Required
- Admin users will need to set new passwords
- Send password reset emails after account creation
- Or provide temporary passwords and force password change

### Account Communication Template
```
Subject: Admin Account Migration - New Login Required

Your admin account has been migrated to our new authentication system.

LOGIN DETAILS:
Email: [same as before]
Temporary Password: [provided separately]

FIRST LOGIN STEPS:
1. Visit: [your-domain]/admin
2. Click "Sign In"
3. Use your email and temporary password
4. You'll be prompted to set a new permanent password
5. Enable 2FA if prompted (recommended)

WHAT'S NEW:
- Unified login system across the entire site
- Enhanced security features
- Same admin permissions and access

Questions? Reply to this email or contact support.
```

---

## 🚨 Security Considerations

### Immediate Actions:
1. **Secure Password Policy**: Ensure strong passwords in Clerk settings
2. **Enable 2FA**: Require two-factor authentication for admin accounts
3. **Session Timeout**: Set appropriate session durations
4. **Audit Logging**: Enable Clerk's audit logs for admin actions

### Access Control:
- Admin metadata should only be settable via Clerk dashboard
- Never allow users to self-assign admin roles
- Regularly audit admin account access

---

## 📞 Next Steps After Configuration

1. **Test Configuration**: Verify all settings work correctly
2. **Create Test Admin Account**: Use a test email to verify flow
3. **Prepare User Communication**: Draft emails for existing admins
4. **Schedule Migration Window**: Plan when to switch over
5. **Update Application Code**: Implement the auth checks and middleware

---

**Estimated Time:** 30-45 minutes for Option A setup
**Complexity:** Medium (mostly dashboard configuration)
**Risk Level:** Low (easily reversible)