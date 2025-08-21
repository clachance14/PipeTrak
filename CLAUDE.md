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

### Project Management
- **🚀 Deployment & Launch**: `.claude/deployment/claude.md`
  - Production checklist, security requirements, deployment steps
- **🛠️ PipeTrak Business Logic**: `.claude/pipetrak/claude.md`
  - Current status, routing architecture, business rules

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

### Code Conventions
- Always understand existing file conventions before making changes
- Mimic existing code style and patterns
- Use existing libraries and utilities rather than introducing new ones
- Follow security best practices - never expose or log secrets/keys

### Quick Reference Links

For specialized topics, see the corresponding `.claude/` directories:

- **🔐 Authentication & Testing**: `.claude/auth/claude.md`
- **🏢 Organizations & Multi-tenancy**: `.claude/organizations/claude.md`
- **💳 Payments & Stripe**: `.claude/payments/claude.md`
- **📧 Email System**: `.claude/email/claude.md`
- **💾 Database & Migrations**: `.claude/database/claude.md`
- **🚀 Deployment & Production**: `.claude/deployment/claude.md`
- **🛠️ PipeTrak Business Logic**: `.claude/pipetrak/claude.md`

---

*This file contains core development guidelines. For system-specific details, see the specialized `.claude/` directories.*