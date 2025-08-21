# PipeTrak Development Runbook

## Quick Start

### Prerequisites
- Node.js 20.x or higher
- pnpm 8.x or higher
- PostgreSQL 14+ (via Supabase local or cloud)
- Git

### Initial Setup (First Time Only)

```bash
# Clone the repository
git clone [repository-url]
cd PipeTrak

# Install dependencies
pnpm install

# Copy environment variables
cp apps/web/.env.example apps/web/.env.local

# Set up environment variables (edit with your values)
nano apps/web/.env.local
```

### Critical: Timestamp Handling

All timestamps in the system are stored in **milliseconds** (using `Date.now()`). When displaying:
- **DO NOT** multiply by 1000 (it's already in milliseconds)
- Use `new Date(timestamp)` directly for date objects
- Example: `new Date(metrics.generatedAt).toLocaleString()`

### Client/Server Code Separation Pattern

When using Prisma or other server-only code:
1. Create an API route in `/app/api/`
2. Create a client-side function in `lib/client-api.ts`
3. Never import server code directly in client components

```typescript
// ❌ WRONG - Client component
import { fetchData } from "./data-loaders"; // Has Prisma import

// ✅ CORRECT - Client component  
import { fetchDataClient } from "./client-api"; // Calls API route
```

### Required Environment Variables

```bash
# Supabase (CRITICAL - Must have valid API keys)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key  # Get from Supabase dashboard
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Get from Supabase dashboard

# Database (Prisma)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres  # Connection pooler
DIRECT_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres    # Direct connection

# Auth (Better Auth)
BETTER_AUTH_SECRET=generate-random-32-char-string
BETTER_AUTH_URL=http://localhost:3000

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# For local development with SSL issues
NODE_TLS_REJECT_UNAUTHORIZED=0  # Only for development!
```

### Getting Supabase API Keys
```bash
# Run this script to check your API keys
cd tooling/scripts
pnpm tsx src/get-supabase-keys.ts

# Test database connection
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-db-connection.ts
```

---

## Development Commands

### Start Development Environment

```bash
# Start all services (recommended)
pnpm dev

# Or start individually:
# Terminal 1: Start Supabase
pnpm supabase start

# Terminal 2: Start Next.js dev server
cd apps/web
pnpm dev
# Note: If port 3000 is in use, server will run on 3001

# Terminal 3: Start Prisma Studio (database GUI)
cd packages/database
pnpm prisma studio
```

### Component Development Patterns

#### React Hooks Rules
Always call hooks at the top level of components, never inside conditionals:

```typescript
// ❌ WRONG - hooks inside conditional
if (isMobile) {
  const data = useMemo(() => computeData(), [deps]);
}

// ✅ CORRECT - hooks at top level
const data = useMemo(() => {
  if (!isMobile) return defaultValue;
  return computeData();
}, [deps, isMobile]);
```

#### Indeterminate Checkbox State
Radix UI Checkbox doesn't support `indeterminate` prop. Use custom implementation:

```typescript
// Custom indeterminate visual
{someSelected && !allSelected ? (
  <div className="h-5 w-5 rounded border-2 border-primary bg-primary flex items-center justify-center">
    <Minus className="h-3 w-3 text-primary-foreground" />
  </div>
) : (
  <Checkbox checked={allSelected} />
)}
```

#### localStorage Persistence Pattern
Save UI state after initial mount to avoid hydration issues:

```typescript
const [state, setState] = useState(defaultValue);
const hasLoadedRef = useRef(false);

// Load from localStorage on mount
useEffect(() => {
  const saved = localStorage.getItem('key');
  if (saved) setState(JSON.parse(saved));
  hasLoadedRef.current = true;
}, []);

// Save to localStorage on change (skip initial)
useEffect(() => {
  if (!hasLoadedRef.current) return;
  localStorage.setItem('key', JSON.stringify(state));
}, [state]);
```

### Database Commands

```bash
# Navigate to database package
cd packages/database

# Generate Prisma client (after schema changes)
pnpm prisma generate

# Create new migration
pnpm prisma migrate dev --name descriptive-migration-name

# Apply migrations
pnpm prisma migrate deploy

# Reset database (WARNING: Deletes all data)
pnpm prisma migrate reset

# Seed database with sample data
pnpm prisma db seed

# Open Prisma Studio (GUI)
pnpm prisma studio

# Check migration status
pnpm prisma migrate status
```

### Supabase Commands

```bash
# Start local Supabase
pnpm supabase start

# Stop Supabase
pnpm supabase stop

# Reset Supabase (WARNING: Deletes all data)
pnpm supabase db reset

# Check Supabase status
pnpm supabase status

# Access Supabase Studio
open http://localhost:54323

# Generate types from database
pnpm supabase gen types typescript --local > packages/database/types/supabase.ts

# Push local migrations to Supabase
pnpm supabase db push

# Pull remote database changes
pnpm supabase db pull
```

### Code Quality Commands

```bash
# Run linting
pnpm lint

# Fix linting issues
pnpm lint --fix

# Type checking
pnpm typecheck

# Format code with Prettier
pnpm format

# Run all checks (before committing)
pnpm check-all

# Biome linting and formatting
pnpm biome check --write
```

### Testing Commands

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests with Playwright
cd apps/web
pnpm e2e

# Run E2E tests in UI mode
pnpm e2e:ui

# Run E2E tests in CI mode
pnpm e2e:ci

# Update Playwright browsers
pnpm exec playwright install

# Test dashboard RPC functions with real data
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-dashboard-functions-real.ts

# Test authentication flow
pnpm tsx src/test-auth-flow.ts
```

### Build Commands

```bash
# Build for production
pnpm build

# Build and analyze bundle
pnpm build:analyze

# Build specific workspace
pnpm --filter @repo/web build

# Clean build artifacts
pnpm clean

# Clean and rebuild
pnpm rebuild
```

---

## Common Development Tasks

### Adding a New Component

```bash
# Create component file
mkdir -p apps/web/modules/pipetrak/components
touch apps/web/modules/pipetrak/components/YourComponent.tsx

# Add types
echo "export interface YourComponentProps {}" >> apps/web/modules/pipetrak/types.ts

# Create test file
mkdir -p apps/web/__tests__/modules/pipetrak/components
touch apps/web/__tests__/modules/pipetrak/components/YourComponent.test.tsx
```

### Adding a New API Route

```bash
# Create API route using Hono
mkdir -p packages/api/modules/pipetrak
touch packages/api/modules/pipetrak/your-route.ts

# Add to API index
echo "export * from './your-route'" >> packages/api/modules/pipetrak/index.ts

# Create validation schema
touch packages/api/modules/pipetrak/your-route.schema.ts
```

### Creating a Database Migration

```bash
# Make schema changes in schema.prisma
nano packages/database/prisma/schema.prisma

# Create migration
cd packages/database
pnpm prisma migrate dev --name add_your_feature

# Generate TypeScript types
pnpm prisma generate

# Update Supabase types
cd ../..
pnpm supabase gen types typescript --local > packages/database/types/supabase.ts
```

## Common Issues & Solutions

### Next.js 15 Async Params Error
**Problem**: "Route used params.X. params should be awaited before using its properties"
**Solution**: Update page components to use async params:
```typescript
// Before
interface PageProps {
  params: { id: string };
}
export default function Page({ params }: PageProps) {
  const id = params.id;
}

// After
interface PageProps {
  params: Promise<{ id: string }>;
}
export default async function Page({ params }: PageProps) {
  const { id } = await params;
}
```

### CUID Validation Errors in API
**Problem**: API returns "Invalid cuid" for valid IDs
**Cause**: Database uses CUID2 format but API validates for CUID v1
**Solution**: Remove `.cuid()` validation from Zod schemas:
```typescript
// Before
z.string().cuid()
// After
z.string()
```

### Server Component API Authentication
**Problem**: API returns 401 Unauthorized from server components
**Solution**: Use `getServerApiClient` instead of regular `apiClient`:
```typescript
// In server components/actions
import { getServerApiClient } from "@shared/lib/server";

const apiClient = await getServerApiClient();
const response = await apiClient.endpoint.$get();
```

### API Response Structure Mismatch
**Problem**: "Cannot read property 'map' of undefined" when processing API response
**Solution**: API returns paginated structure, access data property:
```typescript
// API returns: { data: [...], pagination: {...} }
const response = await response.json();
const items = response.data.map(...); // Not response.map()
```

### Adding Shadcn UI Component

```bash
# Navigate to web app
cd apps/web

# Add component (interactive)
pnpm shadcn-ui add

# Add specific component
pnpm shadcn-ui add button

# Add multiple components
pnpm shadcn-ui add button card dialog
```

---

## Troubleshooting

> 📖 **NEW**: See comprehensive database guides:
> - [Database Operations Guide](./database-operations-guide.md) - Complete reference
> - [Database Quick Reference](./database-quick-reference.md) - Copy-paste commands

### Database Connection Issues

```bash
# Check if Supabase is running (cloud)
echo $DATABASE_URL

# Test connection with SSL workaround
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-connections.ts

# Apply dashboard functions to Supabase
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/apply-dashboard-functions.ts

# Deploy real-time system
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/deploy-realtime-system.ts

# Check which tables exist
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/verify-tables.ts

# NEW: Example using standardized SQL executor
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/execute-sql-example.ts
```

### Dashboard and RPC Functions

```bash
# Test dashboard functions with real data
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-dashboard-functions-real.ts

# Apply migrations manually
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/apply-migrations.ts

# Clean and reseed test data
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/cleanup-and-seed.ts
```

### Migration Issues

```bash
# Check migration status
cd packages/database
pnpm prisma migrate status

# Resolve failed migration
pnpm prisma migrate resolve --applied "20240101000000_migration_name"

# Force reset (WARNING: Data loss)
pnpm prisma migrate reset --force

# Create migration without applying
pnpm prisma migrate dev --create-only
```

### Type Generation Issues

```bash
# Regenerate all types
cd packages/database
pnpm prisma generate

# Clear TypeScript cache
rm -rf apps/web/.next
rm -rf node_modules/.cache
pnpm install

# Rebuild TypeScript
pnpm typecheck --force
```

### Build Errors

```bash
# Clear all caches
rm -rf apps/web/.next
rm -rf node_modules
rm -rf packages/*/node_modules
pnpm install

# Check for type errors
pnpm typecheck

# Check for missing dependencies
pnpm check

# Verify imports
pnpm build --debug
```

### Performance Issues

```bash
# Analyze bundle size
cd apps/web
pnpm build:analyze

# Profile database queries
cd packages/database
pnpm prisma studio
# Check slow query log

# Monitor Next.js performance
cd apps/web
npm run dev -- --profile

# Check for memory leaks
node --inspect apps/web/.next/server/app.js
```

---

## Development Workflow

### Standard Development Flow

```bash
# 1. Start development environment
pnpm dev

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Make changes and test
# ... develop ...

# 4. Run checks
pnpm lint
pnpm typecheck
pnpm test

# 5. Commit changes
git add .
git commit -m "feat: your feature description"

# 6. Push and create PR
git push origin feature/your-feature
```

### Database Development Flow

```bash
# 1. Modify schema
nano packages/database/prisma/schema.prisma

# 2. Create migration
cd packages/database
pnpm prisma migrate dev --name your_migration

# 3. Generate types
pnpm prisma generate

# 4. Test migration
pnpm prisma migrate reset
pnpm prisma db seed

# 5. Update API to use new schema
# ... update code ...

# 6. Test thoroughly
cd ../..
pnpm test
```

### Component Development Flow

```bash
# 1. Create component with types
# apps/web/modules/pipetrak/components/Component.tsx

# 2. Create Storybook story (if using)
# apps/web/modules/pipetrak/components/Component.stories.tsx

# 3. Write tests
# apps/web/__tests__/modules/pipetrak/components/Component.test.tsx

# 4. Use in page
# apps/web/app/(saas)/app/pipetrak/[projectId]/page.tsx

# 5. Test E2E
cd apps/web
pnpm e2e
```

---

## Deployment Commands

### Staging Deployment

```bash
# Build for staging
NODE_ENV=staging pnpm build

# Run database migrations
cd packages/database
pnpm prisma migrate deploy

# Deploy to Vercel (example)
vercel --prod=false

# Deploy to custom server
pnpm build
pnpm start
```

### Production Deployment

```bash
# Pre-deployment checks
pnpm lint
pnpm typecheck
pnpm test
pnpm build

# Deploy database migrations
cd packages/database
DATABASE_URL=$PRODUCTION_DATABASE_URL pnpm prisma migrate deploy

# Deploy application
NODE_ENV=production pnpm build
vercel --prod

# Verify deployment
curl https://your-domain.com/api/health
```

---

## Monitoring & Debugging

### View Logs

```bash
# Next.js logs
pm2 logs next

# Database logs
pnpm supabase logs

# Application logs (if using PM2)
pm2 logs

# Vercel logs
vercel logs
```

### Debug Mode

```bash
# Start with debug output
DEBUG=* pnpm dev

# Debug specific module
DEBUG=prisma:* pnpm dev

# Debug Next.js
NODE_OPTIONS='--inspect' pnpm dev

# Debug with VS Code
# Add to .vscode/launch.json and press F5
```

### Performance Monitoring

```bash
# Generate performance report
cd apps/web
pnpm build --profile
pnpm analyze

# Monitor in production
# Add to your monitoring service:
# - Response times < 2s
# - Database query times < 100ms
# - Error rate < 1%
# - Uptime > 99.9%
```

---

## Emergency Procedures

### Rollback Deployment

```bash
# Vercel rollback
vercel rollback

# Database rollback
cd packages/database
pnpm prisma migrate resolve --rolled-back "20240101000000_bad_migration"
pnpm prisma migrate deploy

# Git rollback
git revert HEAD
git push origin main
```

### Emergency Database Recovery

```bash
# Backup current state
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20240101.sql

# Verify integrity
cd packages/database
pnpm prisma db pull
pnpm prisma validate
```

### Clear All Caches

```bash
# Application caches
rm -rf apps/web/.next
rm -rf node_modules/.cache
rm -rf packages/*/.turbo

# Package manager cache
pnpm store prune
pnpm cache clean --force

# Database query cache (Supabase)
# Execute in Supabase SQL editor:
# SELECT pg_stat_reset();
```

---

## Useful Aliases (Add to ~/.zshrc or ~/.bashrc)

```bash
# PipeTrak shortcuts
alias pt="cd ~/projects/PipeTrak"
alias ptw="cd ~/projects/PipeTrak/apps/web"
alias ptd="cd ~/projects/PipeTrak/packages/database"
alias pta="cd ~/projects/PipeTrak/packages/api"

# Development shortcuts
alias ptdev="pnpm dev"
alias ptbuild="pnpm build"
alias pttest="pnpm test"
alias ptcheck="pnpm lint && pnpm typecheck && pnpm test"

# Database shortcuts
alias ptmigrate="cd packages/database && pnpm prisma migrate dev"
alias ptstudio="cd packages/database && pnpm prisma studio"
alias ptreset="cd packages/database && pnpm prisma migrate reset"

# Supabase shortcuts
alias supa="pnpm supabase"
alias supastart="pnpm supabase start"
alias supastop="pnpm supabase stop"
alias supareset="pnpm supabase db reset"
```

---

## VS Code Settings

### Recommended Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "naumovs.color-highlight",
    "yoavbls.pretty-ts-errors"
  ]
}
```

### Workspace Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

---

## Support Resources

### Documentation
- Supastarter Docs: https://supastarter.dev/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Shadcn UI: https://ui.shadcn.com

### Community
- Project Slack: [your-slack-channel]
- GitHub Issues: [repository-url]/issues
- Internal Wiki: [wiki-url]

### Contacts
- Tech Lead: [contact]
- DevOps: [contact]
- Database Admin: [contact]

---

*Last updated: Phase 1 Completion. This runbook is maintained as the source of truth for development operations.*