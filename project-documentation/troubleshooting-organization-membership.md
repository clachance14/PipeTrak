# Troubleshooting Organization Membership Issues

## Overview
PipeTrak uses Supastarter's multi-tenancy system where all resources (projects, components, milestones) belong to organizations. Users MUST be members of an organization to access its resources.

## Common Error: 403 Access Denied

### Symptoms
- Getting "403 Access denied" when updating components or milestones
- API calls fail with authorization errors despite being logged in
- Features work for some users but not others

### Root Cause
The user is authenticated but not a member of the organization that owns the resource.

## Diagnosis

Run these SQL queries in Supabase to check the current state:

```sql
-- 1. Check all users
SELECT id, email, name, role, "emailVerified", "createdAt" 
FROM public.user
ORDER BY "createdAt" DESC;

-- 2. Check all organizations
SELECT id, name, slug, "createdAt"
FROM public.organization
ORDER BY "createdAt" DESC;

-- 3. Check organization memberships
SELECT 
    m.id,
    m.role as member_role,
    u.email as user_email,
    u.name as user_name,
    o.name as org_name,
    o.slug as org_slug,
    m."createdAt"
FROM public.member m
JOIN public.user u ON m."userId" = u.id
JOIN public.organization o ON m."organizationId" = o.id
ORDER BY m."createdAt" DESC;

-- 4. Check which organization owns the projects
SELECT 
    p.id,
    p."jobName",
    p."jobNumber",
    o.name as org_name,
    o.id as org_id,
    u.email as created_by
FROM public."Project" p
JOIN public.organization o ON p."organizationId" = o.id
JOIN public.user u ON p."createdBy" = u.id;
```

## Solution

If a user needs access to an organization, add them as a member:

```sql
-- Add a user to an organization
INSERT INTO public.member (
    id,
    "organizationId", 
    "userId",
    role,
    "createdAt"
) VALUES (
    gen_random_uuid()::text,
    'ORGANIZATION_ID_HERE',  -- From query #2 above
    'USER_ID_HERE',          -- From query #1 above
    'owner',                 -- Can be: 'owner', 'admin', or 'member'
    NOW()
)
ON CONFLICT ("organizationId", "userId") DO UPDATE
SET role = VALUES(role);  -- Updates role if membership exists
```

### Role Definitions
- **owner**: Full control over organization and all resources
- **admin**: Can manage organization settings and members
- **member**: Can access and modify resources (components, milestones)

### PipeTrak Role Mapping
- **Project Manager**: Should be `owner` or `admin`
- **Foreman**: Should be `member`

## Prevention

### During Development Setup
1. Always ensure test users are added to organizations
2. Run the membership check queries after creating new users
3. Use the `ensure-org-membership.ts` script during setup

### During User Creation
When creating users programmatically, always add them to an organization:

```typescript
// After creating a user
await db.member.create({
  data: {
    userId: newUser.id,
    organizationId: targetOrg.id,
    role: 'member',
    createdAt: new Date(),
  },
});
```

## Quick Fix Script

Run this script to ensure all users are in at least one organization:

```bash
pnpm --filter scripts tsx src/ensure-org-membership.ts
```

## Related Issues

### Issue: Organization exists but has no members
This can happen when:
- Organizations are created via direct SQL insert
- Migration scripts don't properly set up memberships
- Testing data is incomplete

### Issue: User can log in but sees no projects
Check:
1. User is member of at least one organization
2. Projects exist in that organization
3. User's role has appropriate permissions

## API Error Messages

The PipeTrak API will return specific error messages:

- **401**: "User not authenticated" - Session expired or invalid
- **403**: "User is not a member of organization [org_name]" - Add user to organization
- **404**: "Organization not found" - Organization doesn't exist

## Support

If issues persist after following this guide:
1. Check the browser console for detailed error messages
2. Verify the session cookie is being sent with requests
3. Check that the organization ID in the URL matches the database
4. Review the API logs for more detailed error information