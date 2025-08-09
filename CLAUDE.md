# PipeTrak - Supabase/Supastarter Project Guidelines

## Project Overview
This is a Next.js application built with TypeScript, using the Supastarter template with Supabase integration. The codebase follows functional programming patterns with React Server Components as the default approach.

## Tech Stack Expertise
When working on this project, assume expertise in:
- TypeScript
- Node.js
- Next.js App Router
- React
- Shadcn UI
- Radix UI
- Tailwind CSS
- Supabase
- Supastarter patterns

## Key Principles

### Code Generation
- Write concise, technical TypeScript code with accurate examples
- Use functional and declarative programming patterns; avoid classes
- Prefer iteration and modularization over code duplication
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`)
- Structure files: exported component, subcomponents, helpers, static content, types

### Documentation References
- Follow Next.js docs for Data Fetching, Rendering, and Routing
- Follow the documentation at supastarter.dev/docs/nextjs for supastarter specific patterns

## Project Structure

The repository follows this organization:

### Main Application
- `apps/web/app/` - Next.js App Router (all frontend-only code goes here)

### Packages Directory
Backend logic is organized into packages:
- `packages/ai` - All AI-related code
- `packages/api` - All API routes
- `packages/auth` - Config for better-auth and helper functions
- `packages/database` - Database schema and auto-generated types
- `packages/i18n` - Translations and internationalization helper functions
- `packages/logs` - Logging config and helper functions
- `packages/mail` - Providers for sending mails and email templates
- `packages/payments` - Code for payment providers and payment processing
- `packages/storage` - Providers for storing files and images
- `packages/utils` - Utility functions
- `config` - Application configuration

## Naming Conventions

### Files and Directories
- Use lowercase with dashes for directories (e.g., `components/auth-wizard`)
- Use PascalCase for component file names
- Favor named exports for components

### Code
- Use PascalCase for component names
- Use camelCase for variables and method names
- Use descriptive names that clearly indicate purpose

## TypeScript Usage

### Best Practices
- Use TypeScript for all code
- Prefer interfaces over types
- Avoid enums; use maps instead
- Use functional components with TypeScript interfaces
- Ensure proper type safety throughout the application

## UI and Styling

### Component Libraries
- Use Shadcn UI, Radix, and Tailwind for components and styling
- Implement responsive design with Tailwind CSS
- Use a mobile-first approach
- Use the `cn` function for class name concatenation

### Theme Configuration
- Global theme variables and tailwind config are defined in `tooling/tailwind/theme.css`
- Follow existing theme patterns when adding new styles

## Performance Optimization

### React Server Components
- Minimize `'use client'`, `useEffect`, and `setState`
- Favor React Server Components (RSC) by default
- Only use client components when client-side interactivity is required

### Component Loading
- Wrap client components in Suspense with fallback
- Use dynamic loading for non-critical components
- Implement proper loading states

### Image Optimization
- Use WebP format when possible
- Include size data for images
- Implement lazy loading for images below the fold

## Syntax and Formatting

### Function Declarations
- Use the `function` keyword for pure functions
- Use arrow functions for inline callbacks and handlers

### Conditionals
- Avoid unnecessary curly braces in conditionals
- Use concise syntax for simple statements
- Use early returns to reduce nesting

### JSX
- Use declarative JSX
- Keep JSX clean and readable
- Extract complex logic into separate functions or hooks

## Authentication System

### Overview
Supastarter includes a complete authentication system using better-auth with Supabase integration. No additional auth setup is needed for PipeTrak.

### Available Features
- **Complete auth flow**: Login, signup, password reset, email verification, magic links
- **Organization multi-tenancy**: Full support with invitations and member management
- **OAuth providers**: Google and GitHub pre-configured
- **Advanced security**: 2FA, passkeys, session management
- **Admin UI**: Built-in interface for user and organization management

### Role System

#### User Roles
- `admin` - System administrator with full access
- `user` - Standard user role

#### Organization Roles  
- `owner` - Full organization control
- `admin` - Organization administration
- `member` - Standard organization member

### PipeTrak Role Mapping
- **Foreman**: Organization `member` role
- **Project Manager**: Organization `owner` or `admin` role

### Accessing Sessions

#### Client Components
```typescript
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

function ClientComponent() {
  const { session, user } = useSession();
  const { organization, membership } = useActiveOrganization();
  
  // Check permissions
  if (membership?.role === 'owner' || membership?.role === 'admin') {
    // Project Manager access
  }
}
```

#### Server Components
```typescript
import { getSession } from "@saas/auth/lib/server";

async function ServerComponent() {
  const session = await getSession();
  
  if (!session) {
    // Not authenticated
  }
}
```

### Permission Patterns
```typescript
// Route protection (server-side)
if (!session || session.user.role !== 'admin') {
  return redirect("/app");
}

// Feature gating (client-side)
if (membership?.role === 'member') {
  // Show Foreman features
} else if (membership?.role === 'owner' || membership?.role === 'admin') {
  // Show Project Manager features
}
```

### Key Files
- Auth configuration: `packages/auth/auth.ts`
- Session hooks: `apps/web/modules/saas/auth/hooks/`
- Auth components: `apps/web/modules/saas/auth/components/`
- OAuth providers: `apps/web/modules/saas/auth/constants/oauth-providers.tsx`

### Documentation Links
- [User & Session Management](https://supastarter.dev/docs/nextjs/authentication/user-and-session)
- [Permissions](https://supastarter.dev/docs/nextjs/authentication/permissions)
- [OAuth Configuration](https://supastarter.dev/docs/nextjs/authentication/oauth)
- [Super Admin](https://supastarter.dev/docs/nextjs/authentication/superadmin)

## Organizations System

### Overview
Organizations provide a way to share data between users with different roles and permissions. They are managed by better-auth and fully integrated with the authentication system. All organization data is stored in the database, providing complete control over organization management.

### CRITICAL: Organization Membership Requirement
**All users MUST be members of an organization to access PipeTrak resources.** Simply being authenticated is not enough - users need an explicit membership record in the `member` table to access projects, components, and milestones.

#### Common Issues and Solutions
- **403 Access Denied**: User is not a member of the organization
- **Solution**: Add user to organization via SQL or admin UI
- **See**: `project-documentation/troubleshooting-organization-membership.md` for detailed fix instructions

#### Quick Check for Membership Issues
```sql
-- Check if user is member of any organization
SELECT * FROM public.member WHERE "userId" = 'USER_ID_HERE';
```

### Key Concepts
- Organizations are determined by the `organizationSlug` path parameter
- When on a path like `/app/my-organization`, that organization is active
- Benefits of path-based organization routing:
  - Easy to understand which organization is active
  - Shareable links to specific organization pages
  - Easy navigation between organizations
  - Multiple organizations in same browser session

### Configuration Options

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

### Using Organizations in Components

#### Client Components
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

#### Server Components
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

#### Getting Organization Without Slug

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

### Storing Organization Data

#### Database Schema
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

#### API Implementation
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

#### Frontend Mutations
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

#### Querying Organization Data
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

### Key Files
- Organization hooks: `apps/web/modules/saas/organizations/hooks/`
- Organization components: `apps/web/modules/saas/organizations/components/`
- Server utilities: `apps/web/modules/saas/organizations/lib/server.ts`
- Organization configuration: `config/index.ts`

### Documentation Links
- [Organizations Overview](https://supastarter.dev/docs/nextjs/organizations/overview)
- [Configure Organizations](https://supastarter.dev/docs/nextjs/organizations/configure)
- [Use Organizations](https://supastarter.dev/docs/nextjs/organizations/use-organizations)
- [Store Data for Organizations](https://supastarter.dev/docs/nextjs/organizations/store-data-for-organizations)
- [Better-Auth Organizations](https://www.better-auth.com/docs/plugins/organization)

## Payments System (Stripe)

### Overview
Supastarter provides a generic payments module for charging users and managing subscriptions. PipeTrak uses Stripe as the payment provider.

### Stripe Configuration

#### API Keys (Test Environment)
```
STRIPE_PUBLISHABLE_KEY=pk_test_51RiGThQvY49jEN8HvKrQQFQ47bXjEbnujRtcHO8GdE8g9AAMznOD3OeI1YqH5pkc708xI9p8Pi6R9q8N18x3p5iy00GtsStQA3
STRIPE_SECRET_KEY=sk_test_51RiGThQvY49jEN8HzRjMacbh6j7vZHGYcJGkiwHdiPhT52qGG3xfYWxwksKgfeelM5JM2G6grk73tvQ6r0vnNX8b00NOmxc8CC
```

#### Environment Variables
Add to `.env.local` and production environment:
```bash
STRIPE_SECRET_KEY="sk_test_..." # Your Stripe secret key
STRIPE_WEBHOOK_SECRET="" # The webhook secret key (from Stripe dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # Your publishable key
```

#### Webhook Setup

##### Local Development
Use ngrok to create a tunnel:
```bash
ngrok http 3000
```
Use the generated URL + `/api/webhooks/payments`

##### Production
Use your app's URL + `/api/webhooks/payments`

##### Required Webhook Events
Configure these events in Stripe Dashboard:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### Plan Configuration

Configure plans in `config/index.ts`:

```typescript
export const config = {
  payments: {
    plans: {
      // Free tier (optional)
      free: {
        isFree: true,
      },
      
      // Pro subscription plan
      pro: {
        recommended: true,
        prices: [
          {
            type: "recurring",
            productId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
            interval: "month",
            amount: 29,
            currency: "USD",
            seatBased: true, // For organization-based pricing
            trialPeriodDays: 7,
          },
          {
            type: "recurring",
            productId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY,
            interval: "year",
            amount: 290,
            currency: "USD",
            seatBased: true,
            trialPeriodDays: 7,
          },
        ],
      },
      
      // Enterprise plan (contact sales)
      enterprise: {
        isEnterprise: true,
      },
      
      // One-time purchase example
      lifetime: {
        prices: [
          {
            type: "one_time",
            productId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_LIFETIME,
            amount: 999,
            currency: "USD",
          },
        ],
      },
    },
  },
};
```

### Checking Purchases & Subscriptions

#### Client-Side
```typescript
import { usePurchases } from "@saas/payments/hooks/use-purchases";

function Component() {
  const { activePlan, hasSubscription, hasPurchase } = usePurchases();
  
  // Check for active subscription
  const hasActiveSubscription = hasSubscription();
  
  // Check specific plan purchases
  const hasProPurchase = hasPurchase("pro");
  const hasProOrEnterprise = hasPurchase(["pro", "enterprise"]);
  const hasLifetimeAccess = hasPurchase("lifetime");
  
  if (!hasProPurchase) {
    return <UpgradePrompt />;
  }
}
```

#### Server Components
```typescript
import { getPurchases } from "@saas/payments/lib/server";
import { createPurchasesHelper } from "@repo/payments/lib/helper";

export default async function ServerComponent() {
  const purchases = await getPurchases();
  const { activePlan, hasSubscription, hasPurchase } = createPurchasesHelper(purchases);
  
  if (!hasPurchase("pro")) {
    return <PaywallMessage />;
  }
  
  // Protected content
}
```

#### API Routes
```typescript
import { getPurchases } from "../../payments/lib/purchases";
import { createPurchasesHelper } from "@repo/payments/lib/helper";

export async function POST(request: Request) {
  // For organization-level purchases
  const purchases = await getPurchases({ organizationId });
  // Or for user-level purchases
  const purchases = await getPurchases({ userId });
  
  const { hasSubscription, hasPurchase } = createPurchasesHelper(purchases);
  
  if (!hasPurchase(["pro", "enterprise"])) {
    return new Response("Upgrade required", { status: 403 });
  }
  
  // Process request
}
```

### Organization-Based Subscriptions

For seat-based pricing where organizations (not individual users) have subscriptions:

```typescript
// Client-side with organization context
const { activeOrganization } = useActiveOrganization();
const { hasPurchase } = usePurchases({ organizationId: activeOrganization?.id });

// Server-side with organization
const purchases = await getPurchases({ organizationId: organization.id });
```

### Implementing a Paywall

To require payment before accessing the app:

```typescript
// config/index.ts
export const config = {
  payments: {
    plans: {
      free: { 
        isFree: false, // Removes free tier
      },
      // ... paid plans
    }
  },
}
```

This redirects users to `/app/choose-plan` after signup.

### Customer Portal

Stripe Customer Portal allows users to:
- Update payment methods
- Download invoices
- Cancel subscriptions

Access via:
```typescript
import { createCustomerPortalLink } from "@saas/payments/lib/stripe";

const portalUrl = await createCustomerPortalLink({
  customerId: user.stripeCustomerId,
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/billing`,
});
```

### Key Files
- Payment configuration: `config/index.ts`
- Payment hooks: `apps/web/modules/saas/payments/hooks/`
- Server utilities: `apps/web/modules/saas/payments/lib/server.ts`
- Stripe integration: `packages/payments/src/stripe/`
- Webhook handler: `apps/web/app/api/webhooks/payments/route.ts`

### Documentation Links
- [Payments Overview](https://supastarter.dev/docs/nextjs/payments/overview)
- [Stripe Provider Setup](https://supastarter.dev/docs/nextjs/payments/providers/stripe)
- [Managing Plans](https://supastarter.dev/docs/nextjs/payments/plans)
- [Checking Purchases](https://supastarter.dev/docs/nextjs/payments/check-purchases)
- [Implementing Paywall](https://supastarter.dev/docs/nextjs/payments/paywall)
- [Stripe Dashboard](https://dashboard.stripe.com)

## Email System (Resend)

### Overview
Supastarter uses React Email for template creation with Resend as the email service provider. Templates are built as React components with Tailwind CSS styling support.

### Resend Configuration

#### API Key
Already configured in `.env.local`:
```bash
RESEND_API_KEY="re_WBFBYVuA_6VvhAFJmcb6nZhGEypDRhYcH"
```

#### Provider Activation
Resend is activated in `packages/mail/src/provider/index.ts`:
```typescript
export * from "./resend";
```

#### Sender Configuration
Configure sender email in `config/index.ts`:
```typescript
mails: {
  // IMPORTANT: This email domain must be verified in your Resend dashboard
  from: "noreply@pipetrak.co",
}
```

### Email Templates

#### Template Structure
Email templates are React components located in `packages/mail/templates/`:

```typescript
import { 
  Body, 
  Container, 
  Head, 
  Heading, 
  Html, 
  Link, 
  Preview, 
  Text 
} from "@react-email/components";
import { createTranslator } from "@repo/i18n/lib/server";

interface EmailTemplateProps {
  name: string;
  actionUrl?: string;
  locale?: string;
}

export function EmailTemplate({ 
  name, 
  actionUrl, 
  locale = "en" 
}: EmailTemplateProps) {
  const t = await createTranslator({ locale });
  
  return (
    <Html>
      <Head />
      <Preview>{t("email.preview")}</Preview>
      <Body>
        <Container>
          <Heading>{t("email.greeting", { name })}</Heading>
          <Text>{t("email.body")}</Text>
          {actionUrl && (
            <Link href={actionUrl}>
              {t("email.action")}
            </Link>
          )}
        </Container>
      </Body>
    </Html>
  );
}
```

#### Registering Templates
Register new templates in `packages/mail/lib/templates.ts`:

```typescript
import { EmailTemplate } from "../templates/email-template";

export const templates = {
  emailTemplate: EmailTemplate,
  // ... other templates
};
```

### Sending Emails

#### Basic Usage
```typescript
import { sendMail } from "@repo/mail";

await sendMail({
  to: "user@example.com",
  template: "emailTemplate",
  context: {
    name: "John Doe",
    actionUrl: "https://pipetrak.co/verify",
  },
});
```

#### With Multiple Recipients
```typescript
await sendMail({
  to: ["user1@example.com", "user2@example.com"],
  template: "notification",
  context: {
    message: "System update completed",
  },
});
```

#### With Custom Subject
```typescript
await sendMail({
  to: "admin@pipetrak.co",
  subject: "Custom Subject Line",
  template: "alert",
  context: {
    alertType: "warning",
    details: "Resource usage high",
  },
});
```

### Built-in Email Templates

Supastarter includes pre-built templates for:
- **Welcome Email** - Sent after user signup
- **Password Reset** - Password recovery flow
- **Email Verification** - Confirm email address
- **Magic Link** - Passwordless authentication
- **Organization Invitation** - Invite users to organizations
- **Contact Form** - Contact form submissions

### Previewing Templates

Run the email preview server:
```bash
pnpm --filter mail preview
```

This opens a browser interface to preview all email templates with sample data.

### Internationalization

Email templates support multiple languages:

```typescript
// In template component
const t = await createTranslator({ locale });

// In translation files (packages/i18n/messages/[locale].json)
{
  "email": {
    "greeting": "Hello {{name}}",
    "welcome": "Welcome to PipeTrak",
    "verify": "Please verify your email"
  }
}
```

### Contact Form Configuration

Configure contact form in `config/index.ts`:

```typescript
contactForm: {
  enabled: true,
  to: "hello@pipetrak.co", // Where to send contact form emails
  subject: "PipeTrak Contact Form Submission",
}
```

### Testing Emails

#### Development
- Emails are logged to console in development mode
- Use the preview server to test template rendering
- Check Resend dashboard for email logs

#### Production
- Verify domain in Resend dashboard
- Monitor email delivery in Resend analytics
- Set up webhook notifications for bounces/complaints

### Key Files
- Email provider: `packages/mail/src/provider/index.ts`
- Email templates: `packages/mail/templates/`
- Template registry: `packages/mail/lib/templates.ts`
- Send function: `packages/mail/lib/send.ts`
- Configuration: `config/index.ts` (mails section)

### Documentation Links
- [Mailing Overview](https://supastarter.dev/docs/nextjs/mailing/overview)
- [Resend Provider](https://supastarter.dev/docs/nextjs/mailing/resend)
- [React Email](https://react.email)
- [Resend Dashboard](https://resend.com/emails)

## Database Setup

### Supabase Configuration
This project uses Supabase cloud (not local Docker) for the database:
- Connection strings are configured in `.env.local` (symlinked to `.env`)
- DATABASE_URL: Uses connection pooler (port 6543) for serverless/edge functions
- DIRECT_URL: Uses direct connection (port 5432) for migrations
- **Important**: Use `NODE_TLS_REJECT_UNAUTHORIZED=0` for local development with Supabase SSL

### Database Management
```bash
# Push schema changes to Supabase
pnpm --filter database push

# Force push with data loss acceptance
pnpm --filter database push:force

# Generate Prisma client after schema changes
pnpm --filter database generate

# Create a new migration
pnpm --filter database migrate dev --name migration-name

# Deploy migrations to production
pnpm --filter database migrate:deploy
```

### Table Naming Convention
- **All tables use PascalCase**: Component, Drawing, MilestoneTemplate, etc.
- **No @@map directives needed** - Prisma models match table names exactly
- This ensures frontend TypeScript interfaces and backend database tables use identical naming

### Schema Location
- Database schema: `packages/database/prisma/schema.prisma`
- Migrations: `packages/database/prisma/migrations/`
- Generated types: `packages/database/src/client.ts`
- Manual SQL scripts: `packages/database/supabase/`

### Useful Scripts
Located in `tooling/scripts/src/`:
- `migrate-pipetrak-tables.ts` - Create PipeTrak tables manually
- `verify-tables.ts` - Verify all tables exist with row counts
- `drop-pipetrak-tables.ts` - Drop all PipeTrak tables
- `check-tables-direct.ts` - Check table names and structure
- `clean-components.ts` - Clean all component data

## Component Instance Tracking

### Overview
PipeTrak handles the industrial construction reality where the same component (gasket, valve, fitting) appears multiple times on a drawing. Each instance is tracked separately for installation progress.

### Design Principles
- **Instance tracking is per drawing, not per project**
- Components can appear multiple times on the same drawing (e.g., 10 identical gaskets)
- Each instance has its own milestone tracking and completion status
- Foremen can mark "gasket 3 of 10" as installed while others remain pending

### Schema Design
```typescript
model Component {
  // Identification
  componentId        String   // Part number (e.g., "GSWAZ1DZZASG5331")
  instanceNumber     Int      // Instance on THIS drawing (1, 2, 3...)
  totalInstancesOnDrawing Int? // Total count on THIS drawing
  displayId          String?  // "GSWAZ1DZZASG5331 (3 of 10)"
  
  // Unique per drawing, not project
  @@unique([drawingId, componentId, instanceNumber])
}
```

### Import Behavior
- Groups components by drawingId + componentId
- Assigns sequential instance numbers per drawing
- Generates human-readable displayId
- Handles data quality issues (logs warnings for missing drawings)

### Example
Drawing P-35F11 might have:
- GSWAZ1DZZASG5331 (1 of 3)
- GSWAZ1DZZASG5331 (2 of 3)  
- GSWAZ1DZZASG5331 (3 of 3)

Each instance tracks its own installation progress independently.

## Additional Notes

### Testing
- Check README or search codebase for testing approach before writing tests
- Follow existing test patterns in the codebase

### Linting and Type Checking
- Run lint and typecheck commands (e.g., `npm run lint`, `npm run typecheck`) after making changes
- Ensure all code passes linting and type checking before considering task complete

### Code Conventions
- Always understand existing file conventions before making changes
- Mimic existing code style and patterns
- Use existing libraries and utilities rather than introducing new ones
- Follow security best practices - never expose or log secrets/keys

## Authentication Testing Guidelines

### CRITICAL: Always Test Auth Flow After Changes

When modifying any authentication-related code, you MUST test the following to prevent redirect loops and broken auth:

#### Pre-Deployment Checklist
- [ ] **Login Access**: Can users reach `/auth/login` when logged out?
- [ ] **Expired Session**: Can users reach `/auth/login` with an expired/invalid session cookie?
- [ ] **Successful Login**: Does login redirect to `/app` correctly?
- [ ] **Protected Routes**: Does `/app` redirect to `/auth/login` when not authenticated?
- [ ] **Logout Flow**: Does logout clear the session and redirect appropriately?
- [ ] **API Endpoints**: Do `/api/auth/*` endpoints return proper status codes (not 404)?
- [ ] **No Loops**: Check browser network tab for redirect loops
- [ ] **Clean State**: Test with cleared cookies/cache
- [ ] **Session Expiry**: Test with manually expired session cookies

#### Common Pitfalls to Avoid
1. **Never block `/auth/login` access** - Even with invalid cookies
2. **Understand cookie vs session** - Cookie existence ≠ valid session
3. **Test middleware changes** - Middleware affects all route access
4. **Verify API routes** - Ensure `/api/auth/*` routes are properly mounted

#### Quick Debug Commands
```bash
# Test auth endpoint
curl -I http://localhost:3000/api/auth/session

# Should return 200 (with session) or 401 (without), never 404
```

#### If You Encounter Redirect Loops
1. Check `apps/web/middleware.ts` - Ensure login page is accessible
2. Check `apps/web/app/(saas)/app/layout.tsx` - Verify session validation
3. Clear browser cookies and try again
4. Check browser network tab for the redirect pattern

See `project-documentation/authentication-flow.md` for detailed auth architecture.

## Launch Readiness Checklist

### Pre-Launch Requirements

This checklist ensures your SaaS application is production-ready before going live.

#### 1. Email System
- [ ] Customize all email templates in `/packages/mail/emails`
- [ ] Update logo in `Wrapper.tsx` template component
- [ ] Verify all email templates work correctly
- [ ] Ensure all email templates are translated for supported languages
- [ ] Verify domain in email provider (Resend)
- [ ] Configure `from` email address in `config/index.ts`
- [ ] Test email delivery for all user flows:
  - [ ] Welcome email
  - [ ] Password reset
  - [ ] Email verification
  - [ ] Organization invitations
  - [ ] Contact form submissions

#### 2. Internationalization
- [ ] Enable only languages you actively support
- [ ] Ensure all language keys are fully translated
- [ ] Remove or disable unsupported language options
- [ ] Test language switching functionality
- [ ] Verify currency display for each locale

#### 3. Payments
- [ ] Create products/subscriptions in Stripe production mode
- [ ] Verify pricing is correct (monthly/yearly amounts)
- [ ] Configure all supported currencies
- [ ] Set up production webhooks with signing secret
- [ ] Point webhooks to production URL (`https://pipetrak.co/api/webhooks/payments`)
- [ ] Test complete payment flow with production test cards
- [ ] Configure Stripe Customer Portal

#### 4. SEO Optimization
- [ ] Add meta titles and descriptions to all pages
- [ ] Create and configure sitemap.xml
- [ ] Ensure all public pages are indexable
- [ ] Add Open Graph tags for social sharing
- [ ] Configure robots.txt appropriately
- [ ] Set up Google Search Console
- [ ] Submit sitemap to search engines

#### 5. Legal Compliance
Create and link the following legal pages:
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Cookie Policy
- [ ] Imprint/About page
- [ ] GDPR compliance features (if applicable)
- [ ] Cookie consent banner (if required)

#### 6. Performance & Security
- [ ] Enable rate limiting on API endpoints
- [ ] Configure security headers (CSP, HSTS, etc.)
- [ ] Set up monitoring and error tracking
- [ ] Configure CDN for static assets
- [ ] Optimize images and bundle sizes
- [ ] Test loading performance with Lighthouse

#### 7. Deployment Configuration
- [ ] Set all environment variables in production
- [ ] Use production API keys and secrets
- [ ] Select deployment region close to:
  - [ ] Database location (minimize latency)
  - [ ] Target audience location
- [ ] Configure auto-scaling if needed
- [ ] Set up database backups
- [ ] Configure logging and monitoring

#### 8. Final Testing
- [ ] Complete user journey testing in production environment
- [ ] Test all payment flows
- [ ] Verify email delivery
- [ ] Test organization features
- [ ] Check mobile responsiveness
- [ ] Verify all forms and validations
- [ ] Test error handling and edge cases

## Production Deployment Todos

### Stripe Production Setup
Before deploying to production, complete these Stripe configuration tasks:

#### 1. Create Products in Stripe Dashboard
- [ ] Log into [Stripe Dashboard](https://dashboard.stripe.com)
- [ ] Navigate to Products page
- [ ] Create product for "Pro" subscription plan
  - [ ] Add monthly price ($29/month)
  - [ ] Add yearly price ($290/year)
  - [ ] Enable seat-based pricing if needed
- [ ] Create product for "Lifetime" one-time purchase ($999)
- [ ] Note all Product IDs and Price IDs

#### 2. Configure Webhook Endpoint
- [ ] Go to [Webhooks page](https://dashboard.stripe.com/webhooks)
- [ ] Add production endpoint: `https://pipetrak.co/api/webhooks/payments`
- [ ] Select required events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
- [ ] Copy the webhook signing secret

#### 3. Update Environment Variables
- [ ] Replace test Stripe keys with production keys
- [ ] Add `STRIPE_WEBHOOK_SECRET` from webhook configuration
- [ ] Update product price IDs in `.env`:
  - [ ] `NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY`
  - [ ] `NEXT_PUBLIC_PRICE_ID_PRO_YEARLY`
  - [ ] `NEXT_PUBLIC_PRICE_ID_LIFETIME`

#### 4. Configure Stripe Customer Portal
- [ ] Go to [Customer Portal settings](https://dashboard.stripe.com/settings/billing/portal)
- [ ] Enable Customer Portal
- [ ] Configure allowed actions (update payment, cancel subscription, etc.)
- [ ] Set business information and branding

#### 5. Test Payment Flow
- [ ] Test subscription signup with test card
- [ ] Verify webhook receives events
- [ ] Test customer portal access
- [ ] Test subscription cancellation flow

### Other Production Requirements

#### Authentication
- [ ] Set up production OAuth apps:
  - [ ] GitHub OAuth App (production redirect URLs)
  - [ ] Google OAuth App (production redirect URLs)
- [ ] Update OAuth credentials in production environment

#### Database
- [ ] Run database migrations on production Supabase
- [ ] Verify RLS policies are enabled
- [ ] Set up database backups

#### Email (Resend)
- [ ] Verify domain (pipetrak.co) in [Resend Dashboard](https://resend.com/domains)
- [ ] Update sender email from `noreply@pipetrak.co` if needed
- [ ] Configure production email provider (Resend)
- [ ] Update email templates with production URLs
- [ ] Test email delivery (signup, password reset, etc.)
- [ ] Set up webhook for bounces and complaints
- [ ] Update contact form recipient email in config

#### Domain & Hosting
- [ ] Configure custom domain (pipetrak.co)
- [ ] Set up SSL certificates
- [ ] Configure production environment variables on Vercel
- [ ] Set up monitoring and error tracking

#### Security
- [ ] Generate new `BETTER_AUTH_SECRET` for production
- [ ] Review and update CORS settings
- [ ] Enable rate limiting
- [ ] Set up security headers

#### Performance
- [ ] Configure CDN for static assets
- [ ] Set up caching strategies
- [ ] Enable compression
- [ ] Configure image optimization

---

*This file contains project-specific guidelines for Claude Code. Update as needed when patterns evolve or new conventions are established.*