# PipeTrak - Development Guidelines

## Project Overview
This is a Next.js application built with TypeScript, using the Supastarter template with Supabase integration. The codebase follows functional programming patterns with React Server Components as the default approach.

PipeTrak is an industrial construction pipe tracking system designed to replace Excel-based workflows with a modern web application for foremen and project managers.

> 📋 **Project Status & Business Logic**: See `.claude/pipetrak/claude.md` for current development status, routing architecture, and PipeTrak-specific business logic.

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
- `apps/web/modules/pipetrak/` - PipeTrak-specific React components and logic

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

## Specialized Documentation

For detailed information on specific systems, refer to these specialized guides:

### Core Systems
- **🔐 Authentication & Permissions**: `.claude/auth/claude.md`
  - Role system, session management, permission patterns
- **🏢 Organizations & Multi-tenancy**: `.claude/organizations/claude.md`
  - Organization membership, scoped data, API patterns
- **💳 Payments & Subscriptions**: `.claude/payments/claude.md`
  - Stripe configuration, plan setup, subscription handling
- **📧 Email System**: `.claude/email/claude.md`
  - Resend setup, template creation, email sending
- **💾 Database & Schema**: `.claude/database/claude.md`
  - Supabase setup, migrations, component instance tracking
- **📱 Mobile Interface Design**: `project-documentation/mobile-ux-guide.md`
  - Direct-tap milestone system, field usability, construction workflow support
  - **✅ Recent Update**: Direct milestone update implementation completed (Jan 2025)

### Project Management
- **🚀 Deployment & Launch**: `.claude/deployment/claude.md`
  - Production checklist, security requirements, deployment steps
- **🛠️ PipeTrak Business Logic**: `.claude/pipetrak/claude.md`
  - Current status, routing architecture, business rules
- **📋 Linear Issue Tracking**: `.claude/linear/claude.md`
  - MCP commands, workflow patterns, project structure, labeling system

## Development Standards

### Testing
- Check README or search codebase for testing approach before writing tests
- Follow existing test patterns in the codebase
- Test locations: `apps/web/modules/pipetrak/*/__tests__/`

### Linting and Type Checking
- Run lint and typecheck commands after making changes:
  ```bash
  pnpm lint
  pnpm typecheck
  ```
- Ensure all code passes linting and type checking before considering task complete
- Use validation commands for comprehensive checking:
  ```bash
  pnpm check:all    # Runs lint, typecheck, and tests
  pnpm validate     # Alias for check:all
  ```

### Type Safety Guidelines
- **Strict Mode Enabled**: All TypeScript code uses strict compiler options
- **Pre-commit Validation**: Husky hooks automatically run type checking before commits
- **CI/CD Integration**: GitHub Actions validate TypeScript on all PRs
- **Component Props**: Follow documented prop interfaces (see `/docs/COMPONENT_USAGE.md`)
  - Button components use `variant` prop
  - Badge components use `status` prop
- **Migration Tracking**: Breaking changes documented in `/docs/MIGRATIONS.md`
- **Development Scripts**: Use `pnpm dev:typecheck` for watch mode type checking

### Code Conventions
- Always understand existing file conventions before making changes
- Mimic existing code style and patterns
- Use existing libraries and utilities rather than introducing new ones
- Follow security best practices - never expose or log secrets/keys

## Issue Tracking with Linear

This project uses Linear for bug tracking, feature requests, and documentation via MCP (Model Context Protocol) integration.

### Linear Setup
- **Team**: PipeTrak (ID: `173da0c8-0e1e-4a5d-94b3-84d02bfbe593`)
- **Projects**: 6 organized epics covering all major system areas
- **Labels**: Comprehensive labeling system for priority, type, and workflow tracking

### Common Operations
- Create issues with proper project assignment and labels
- Update issue status and track progress
- Add comments for session handoffs and progress updates
- Search and filter issues by project, label, or assignee
- Document session state and knowledge base items

### Key Labels for Development
- **Session Management**: `Session-Handoff`, `Next-Session`, `Context-Restoration`
- **Workflow States**: `Action-Required`, `Needs-Review`, `Needs-QA`, `Blocked`
- **Knowledge Sharing**: `Knowledge-Base`, `Investigation`, `Documentation`
- **Priority Levels**: `Priority: Critical`, `Priority: High`, `Priority: Medium`, `Priority: Low`

For detailed Linear MCP commands and workflows, see `.claude/linear/claude.md`.

## Vercel Deployment & Production

### Working Configuration (January 2025)

The application is successfully deployed on Vercel with the following critical fixes applied:

#### Prisma Prepared Statement Errors - RESOLVED ✅
- **Issue**: PostgreSQL "prepared statement already exists" errors in serverless environment
- **Solution**: pgbouncer connection pooling + `skipPreparedStatements` in Better-Auth adapter
- **Config Files**: `packages/database/prisma/client.ts`, `packages/auth/auth.ts`

#### Organization Routing 404s - RESOLVED ✅
- **Issue**: Users redirected to `/app/ics-inc` returning 404 due to database connection failures
- **Solution**: Error-resilient redirect logic with fallback to PipeTrak routes
- **Config Files**: Organization page components with try/catch error handling

### Quick Troubleshooting Reference

#### Database Connection Issues
```bash
# Check if prepared statement errors are occurring
vercel logs --app=pipe-trak --since=1h | grep -i "prepared statement"

# Test database connectivity
curl -I https://pipe-trak.vercel.app/api/auth/session
```

#### Authentication Flow Issues
1. Verify `BETTER_AUTH_SECRET` is set in Vercel environment
2. Check organization slug exists in database
3. Test redirect flow: Login → `/app` → `/app/{org}/pipetrak`
4. Review error handling in organization page components

### Environment Variables Required
```bash
# Production (Vercel automatically provides these)
POSTGRES_URL=postgresql://...?pgbouncer=true
BETTER_AUTH_SECRET=production-secret
NEXT_PUBLIC_SITE_URL=https://pipe-trak.vercel.app

# Automatically set by Vercel
VERCEL=1
VERCEL_ENV=production
```

### Detailed Documentation
- **🏗️ Deployment Success Snapshot**: `.claude/vercel-deployment/SUCCESS_2025-01-11.md`
- **🔐 Production Auth Flow**: `.claude/auth/PRODUCTION_AUTH_FLOW.md`  
- **💾 Database Connection Guide**: `.claude/database/VERCEL_CONNECTION_GUIDE.md`

### Linear Integration for Deployment Issues
```bash
# Create deployment issue
mcp__linear__create_issue(
  title: "Deployment Issue: [Brief Description]",
  team: "PipeTrak",
  project: "Database Optimization", 
  labels: ["Bug", "DevOps", "Priority: High"]
)
```

**Deployment Health**: ✅ All systems operational as of January 11, 2025

### Quick Reference Links

For specialized topics, see the corresponding `.claude/` directories:

- **🔐 Authentication & Testing**: `.claude/auth/claude.md`
- **🏢 Organizations & Multi-tenancy**: `.claude/organizations/claude.md`
- **💳 Payments & Stripe**: `.claude/payments/claude.md`
- **📧 Email System**: `.claude/email/claude.md`
- **💾 Database & Migrations**: `.claude/database/claude.md`
- **🚀 Deployment & Production**: `.claude/deployment/claude.md`
- **🛠️ PipeTrak Business Logic**: `.claude/pipetrak/claude.md`
- **📋 Linear Issue Tracking**: `.claude/linear/claude.md`
- **📱 Mobile UX Documentation**: `project-documentation/`
  - Mobile UX Guide, Milestone Dependencies, Implementation Guide

---

*This file contains core development guidelines. For system-specific details, see the specialized `.claude/` directories.*