# PipeTrak Context and Domain Knowledge

## Project Overview
PipeTrak is an industrial construction pipe tracking system designed to replace Excel-based workflows with a modern web application for foremen and project managers.

## Technology Stack
- **Frontend**: Next.js with App Router, React, TypeScript
- **UI**: Shadcn UI, Radix UI, Tailwind CSS
- **Backend**: Supabase, better-auth
- **Framework**: Supastarter template
- **Database**: PostgreSQL via Supabase
- **Deployment**: Vercel (frontend), Supabase (backend)

## Key Business Concepts

### Components
- Physical pipe components (elbows, tees, valves, etc.)
- Each component has unique identifiers and properties
- Components are tracked through various milestones
- Status tracking through completion percentages

### Milestones
- Stages in component construction process
- Examples: Fabrication, Installation, Testing, Completion
- Each milestone can have different tracking methods:
  - Discrete (complete/incomplete)
  - Percentage (0-100%)
  - Quantity (partial completion tracking)

### Projects
- Top-level organizational unit
- Contains multiple components
- Has associated drawings and documentation
- Supports multi-organization access

### Drawings
- Technical drawings showing pipe layouts
- Hierarchical structure (areas, systems, drawings)
- Components are associated with specific drawings
- Navigation pattern: Area → System → Drawing → Components

### Quality Control (QC)
- Field weld tracking and management
- Welder certification and assignment
- Completion tracking for welds
- Integration with component milestones

## User Personas

### Foremen
- Primary field users
- Need mobile-first interface
- Focus on updating component status
- Quick access to drawing information
- Bulk update capabilities for efficiency

### Project Managers
- Dashboard and reporting focus
- Progress tracking across projects
- Resource allocation and planning
- Export capabilities for reporting

### QC Inspectors
- Weld tracking and validation
- Welder management
- Quality metrics and reporting
- Mobile inspection workflows

## Architecture Patterns

### File Organization
```
apps/web/
├── app/ - Next.js App Router pages
├── modules/pipetrak/ - PipeTrak-specific components
│   ├── components/ - Component management
│   ├── dashboard/ - Dashboard and reporting
│   ├── drawings/ - Drawing navigation
│   ├── qc/ - Quality control features
│   └── shared/ - Shared PipeTrak components
```

### Database Patterns
- Row Level Security (RLS) for multi-tenancy
- Organization-based data scoping
- Real-time subscriptions for live updates
- Audit trails for change tracking

### Component Patterns
- Server Components by default
- Client Components only when needed
- Mobile-first responsive design
- Loading states and error boundaries

## Development Standards

### Code Conventions
- TypeScript for all code
- Functional programming patterns
- Named exports preferred
- Descriptive variable names

### UI/UX Standards
- Mobile-first design approach
- Industrial/construction-friendly interfaces
- High contrast for field visibility
- Touch-friendly interactions

### Performance Requirements
- Fast loading on mobile networks
- Optimistic UI updates
- Efficient data pagination
- Minimal JavaScript bundles

## Common Workflows

### Component Import
- Excel file upload and parsing
- Column mapping for different formats
- Validation and error handling
- Bulk import with progress tracking

### Milestone Updates
- Individual component updates
- Bulk update capabilities
- Real-time synchronization
- Audit trail maintenance

### Drawing Navigation
- Hierarchical browsing (Area → System → Drawing)
- Component count indicators
- Search and filter capabilities
- Mobile-optimized navigation

### Reporting
- Progress reports by various dimensions
- Export capabilities (PDF, Excel)
- Real-time dashboard updates
- Mobile-friendly report viewing

## Integration Points

### Supabase Features Used
- Authentication (better-auth)
- Database (PostgreSQL)
- Real-time subscriptions
- Row Level Security
- Edge Functions
- Storage for file uploads

### External Dependencies
- Excel parsing libraries
- PDF generation for reports
- Mobile-optimized UI components
- Real-time notification systems

## Quality Assurance

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user journeys
- Mobile responsiveness testing

### Performance Monitoring
- Core Web Vitals tracking
- Mobile network performance
- Database query optimization
- Real-time update performance

## Deployment Considerations

### Environment Management
- Development/staging/production environments
- Feature flags for gradual rollouts
- Database migration strategies
- Real-time sync reliability

### Security Requirements
- Multi-organization data isolation
- User authentication and authorization
- Audit logging for compliance
- Data backup and recovery

---

*This context should be referenced when working on PipeTrak features to ensure consistency with domain requirements and technical architecture.*