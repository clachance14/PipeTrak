# Organizations System

## Overview
Organizations provide a way to share data between users with different roles and permissions. They are managed by better-auth and fully integrated with the authentication system. All organization data is stored in the database, providing complete control over organization management.

## CRITICAL: Organization Membership Requirement
**All users MUST be members of an organization to access PipeTrak resources.** Simply being authenticated is not enough - users need an explicit membership record in the `member` table to access projects, components, and milestones.

### Common Issues and Solutions
- **403 Access Denied**: User is not a member of the organization
- **Solution**: Add user to organization via SQL or admin UI
- **See**: `project-documentation/troubleshooting-organization-membership.md` for detailed fix instructions

### Quick Check for Membership Issues
```sql
-- Check if user is member of any organization
SELECT * FROM public.member WHERE "userId" = 'USER_ID_HERE';
```

## Key Concepts
- Organizations are determined by the `organizationSlug` path parameter
- When on a path like `/app/my-organization`, that organization is active
- Benefits of path-based organization routing:
  - Easy to understand which organization is active
  - Shareable links to specific organization pages
  - Easy navigation between organizations
  - Multiple organizations in same browser session

## Configuration Options

Configure organizations in `config/index.ts`:

```typescript
const config = {
  organizations: {
    // Disable organizations completely
    enabled: false,
    
    // Require organization membership after signup
    requireOrganization: true,
    
    // Hide organization selection in UI
    hideOrganization: true,
    
    // Prevent users from creating new organizations
    enableUsersToCreateOrganizations: false,
  },
  
  // For invite-only organizations, disable user signup
  auth: {
    enableSignup: false,
  },
};
```

## Using Organizations in Components

### Client Components
```typescript
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

function ClientComponent() {
  const { 
    activeOrganization, 
    setActiveOrganization, 
    loaded, 
    isOrganizationAdmin, 
    refetchActiveOrganization 
  } = useActiveOrganization();

  // Check organization status
  if (!loaded) return <div>Loading...</div>;
  if (!activeOrganization) return <div>No active organization</div>;
  if (!isOrganizationAdmin) return <div>Not an admin</div>;

  // Refetch organization data if needed
  await refetchActiveOrganization();
  
  return <div>Organization: {activeOrganization.name}</div>;
}
```

### Server Components
```typescript
import { getActiveOrganization } from "@saas/organizations/lib/server";

export default async function OrganizationPage({
  params,
}: {
  params: { organizationSlug: string };
}) {
  const organization = await getActiveOrganization(params.organizationSlug);
  return <div>Active organization: {organization.name}</div>;
}
```

### Getting Organization Without Slug

Client-side:
```typescript
const { data, error } = await authClient.organization.getFullOrganization({
  query: { organizationId: '1234lasjdfwlj34l' },
});
```

Server-side:
```typescript
const organization = await auth.api.getFullOrganization({
  headers: await headers(),
  query: { organizationId: '1234lasjdfwlj34l' },
});
```

## Storing Organization Data

### Database Schema
Add organization relations to your models:

```prisma
model Post {
  id             String   @id @default(cuid())
  title          String
  content        String
  authorId       String
  author         User     @relation(fields: [authorId], references: [id])
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
}

model Organization {
  posts Post[]
}

model User {
  posts Post[]
}
```

### API Implementation
Create organization-scoped endpoints:

```typescript
import { verifyOrganizationMembership } from "@saas/organizations/lib/server";

export const postsRouter = new Hono()
  .post("/", 
    authMiddleware,
    validator("json", z.object({
      title: z.string(),
      content: z.string(),
      organizationId: z.string(),
    })),
    async (c) => {
      const { title, content, organizationId } = await c.req.valid("json");
      const user = c.get("user");

      // Verify organization membership
      const { organization, role } = await verifyOrganizationMembership(
        organizationId, 
        user.id
      );

      // Optionally check role for permissions
      if (role !== 'owner' && role !== 'admin') {
        return c.json({ error: "Insufficient permissions" }, 403);
      }

      const post = await db.post.create({
        data: {
          title,
          content,
          authorId: user.id,
          organizationId,
        },
      });

      return c.json(post);
    }
  );
```

### Frontend Mutations
Create organization-aware mutations:

```typescript
export const useCreateOrganizationPostMutation = () => {
  const { activeOrganization } = useActiveOrganization();
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.posts.$post({ 
        json: {
          ...data,
          organizationId: activeOrganization.id,
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to create post");
      }
      
      return response.json();
    },
  });
};
```

### Querying Organization Data
Fetch organization-scoped data:

```typescript
export const useOrganizationPosts = (organizationId: string) => {
  return useQuery({
    queryKey: ["posts", organizationId],
    queryFn: async () => {
      const response = await apiClient.posts.$get({
        query: { organizationId },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
      
      return response.json();
    },
  });
};
```

## Key Files
- Organization hooks: `apps/web/modules/saas/organizations/hooks/`
- Organization components: `apps/web/modules/saas/organizations/components/`
- Server utilities: `apps/web/modules/saas/organizations/lib/server.ts`
- Organization configuration: `config/index.ts`

## Documentation Links
- [Organizations Overview](https://supastarter.dev/docs/nextjs/organizations/overview)
- [Configure Organizations](https://supastarter.dev/docs/nextjs/organizations/configure)
- [Use Organizations](https://supastarter.dev/docs/nextjs/organizations/use-organizations)
- [Store Data for Organizations](https://supastarter.dev/docs/nextjs/organizations/store-data-for-organizations)
- [Better-Auth Organizations](https://www.better-auth.com/docs/plugins/organization)